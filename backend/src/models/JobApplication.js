import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true
    },
    companyName: {
      type: String,
      required: true,
      trim: true
    },
    applyEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    matchScore: {
      type: Number,
      default: 0
    },
    coverEmailSubject: {
      type: String,
      trim: true
    },
    coverEmailBody: {
      type: String
    },
    status: {
      type: String,
      enum: ['DRAFTED', 'APPROVED', 'SENT', 'FAILED'],
      default: 'DRAFTED'
    },
    sentAt: {
      type: Date
    },
    errorMessage: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export const JobApplication =
  mongoose.models.JobApplication || mongoose.model('JobApplication', jobApplicationSchema);

export default JobApplication;
