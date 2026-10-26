import { z } from 'zod';

export const experienceItemSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  role: z.string().min(1, 'Role is required'),
  location: z.string().optional().default(''),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().default(''),
  isCurrent: z.boolean().default(false),
  bulletPoints: z
    .array(z.string().min(5, 'Bullet point must be at least 5 characters'))
    .min(1, 'At least one bullet point is required')
});

export const educationItemSchema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().min(1, 'Degree is required'),
  fieldOfStudy: z.string().min(1, 'Field of study is required'),
  graduationYear: z.union([z.string(), z.number()]).transform((val) => String(val))
});

export const projectItemSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().min(10, 'Project description must be at least 10 characters'),
  liveUrl: z.string().url('Invalid URL').or(z.literal('')).optional().default(''),
  techStack: z.array(z.string()).default([])
});

export const resumeSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(100, 'Title cannot exceed 100 characters')
    .default('My Resume'),
  personalInfo: z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Valid email is required'),
    phone: z.string().min(5, 'Phone must be at least 5 characters'),
    location: z.string().min(2, 'Location must be at least 2 characters'),
    linkedinUrl: z.string().url('Invalid LinkedIn URL').or(z.literal('')).optional().default(''),
    githubUrl: z.string().url('Invalid GitHub URL').or(z.literal('')).optional().default(''),
    summary: z.string().max(1000, 'Summary cannot exceed 1000 characters').optional().default('')
  }),
  experience: z.array(experienceItemSchema).default([]),
  education: z.array(educationItemSchema).default([]),
  skills: z
    .array(z.string().min(1, 'Skill cannot be empty'))
    .min(1, 'At least one skill is required'),
  projects: z.array(projectItemSchema).default([])
});

export default resumeSchema;
