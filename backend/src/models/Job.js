import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  externalId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, default: 'Remote' },
  category: { type: String },
  description: { type: String },
  url: { type: String, required: true },
  source: { type: String },
  publishedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Job', jobSchema);
