import { z } from 'zod';

export const experienceItemSchema = z.object({
  company: z.string().min(1, 'Company name is required').trim(),
  role: z.string().min(1, 'Role is required').trim(),
  location: z.string().optional().default(''),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().default(''),
  isCurrent: z.boolean().default(false),
  bulletPoints: z
    .array(z.string().min(5, 'Bullet point must be at least 5 characters'))
    .min(1, 'At least one bullet point is required')
});

export const educationItemSchema = z.object({
  institution: z.string().min(1, 'Institution is required').trim(),
  degree: z.string().min(1, 'Degree is required').trim(),
  fieldOfStudy: z.string().min(1, 'Field of study is required').trim(),
  graduationYear: z.union([z.string(), z.number()]).transform((val) => String(val).trim())
});

export const projectItemSchema = z.object({
  name: z.string().min(1, 'Project name is required').trim(),
  description: z.string().min(10, 'Project description must be at least 10 characters').trim(),
  liveUrl: z.string().url('Invalid URL').or(z.literal('')).optional().default(''),
  techStack: z.array(z.string().trim()).default([])
});

export const resumeSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(100, 'Title cannot exceed 100 characters')
    .trim()
    .default('My Resume'),
  personalInfo: z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').trim(),
    email: z.string().email('Valid email is required').trim().toLowerCase(),
    phone: z.string().min(5, 'Phone must be at least 5 characters').trim(),
    location: z.string().min(2, 'Location must be at least 2 characters').trim(),
    linkedinUrl: z.string().url('Invalid LinkedIn URL').or(z.literal('')).optional().default(''),
    githubUrl: z.string().url('Invalid GitHub URL').or(z.literal('')).optional().default(''),
    summary: z.string().max(1000, 'Summary cannot exceed 1000 characters').optional().default('')
  }),
  experience: z.array(experienceItemSchema).default([]),
  education: z.array(educationItemSchema).default([]),
  skills: z
    .array(z.string().min(1, 'Skill cannot be empty').trim())
    .min(1, 'At least one skill is required'),
  projects: z.array(projectItemSchema).default([])
});

export default resumeSchema;
