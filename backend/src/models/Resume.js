import mongoose from 'mongoose';

const experienceSchema = new mongoose.Schema({
  company: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    default: '',
    trim: true
  },
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    default: ''
  },
  isCurrent: {
    type: Boolean,
    default: false
  },
  bulletPoints: [
    {
      type: String,
      required: true
    }
  ]
});

const educationSchema = new mongoose.Schema({
  institution: {
    type: String,
    required: true,
    trim: true
  },
  degree: {
    type: String,
    required: true,
    trim: true
  },
  fieldOfStudy: {
    type: String,
    required: true,
    trim: true
  },
  graduationYear: {
    type: String,
    required: true,
    trim: true
  }
});

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  liveUrl: {
    type: String,
    default: '',
    trim: true
  },
  techStack: [
    {
      type: String,
      trim: true
    }
  ]
});

const personalInfoSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    linkedinUrl: {
      type: String,
      default: '',
      trim: true
    },
    githubUrl: {
      type: String,
      default: '',
      trim: true
    },
    summary: {
      type: String,
      default: '',
      trim: true
    }
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
    title: {
      type: String,
      default: 'My Resume',
      trim: true
    },
    personalInfo: {
      type: personalInfoSchema,
      required: true
    },
    experience: {
      type: [experienceSchema],
      default: []
    },
    education: {
      type: [educationSchema],
      default: []
    },
    skills: [
      {
        type: String,
        required: true
      }
    ],
    projects: {
      type: [projectSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export const Resume = mongoose.models.Resume || mongoose.model('Resume', resumeSchema);
export default Resume;
