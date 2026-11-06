import mongoose from 'mongoose';

const experienceSchema = new mongoose.Schema(
  {
    role: { type: String, default: '' },
    company: { type: String, default: '' },
    responsibilities: { type: String, default: '' }
  },
  { _id: false }
);

const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, default: '' },
    institution: { type: String, default: '' },
    year: { type: String, default: '' }
  },
  { _id: false }
);

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
    experience: { type: [experienceSchema], default: [] },
    education: { type: [educationSchema], default: [] }
  },
  { timestamps: true }
);

export const Resume = mongoose.models.Resume || mongoose.model('Resume', resumeSchema);
export default Resume;
