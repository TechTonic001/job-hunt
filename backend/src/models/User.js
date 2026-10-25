import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      default: 'Applicant'
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    firebaseUid: {
      type: String,
      index: true,
      sparse: true
    },
    encryptedRefreshToken: {
      type: String
    },
    applicationsSentToday: {
      type: Number,
      default: 0
    },
    dailyApplicationLimit: {
      type: Number,
      default: 10
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
