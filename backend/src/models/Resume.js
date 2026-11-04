import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    personalInfo: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      title: { type: String, default: '' }
    },
    summary: {
      type: String,
      default: ''
    },
    skills: {
      type: [String],
      default: []
    },
    experience: {
      type: mongoose.Schema.Types.Mixed,
      default: ''
    },
    education: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

export const Resume = mongoose.models.Resume || mongoose.model('Resume', resumeSchema);
export default Resume;
