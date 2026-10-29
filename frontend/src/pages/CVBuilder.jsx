/* oxlint-disable react/incompatible-library */
import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axiosClient from '../api/axiosClient.js';
import { resumeSchema } from '../validators/resumeSchema.js';

const DEFAULT_RESUME_VALUES = {
  title: 'My Resume',
  personalInfo: {
    fullName: 'Amoo Halleluyah Olamilekan',
    email: 'test@example.com',
    phone: '+2340000000000',
    location: 'Ogbomoso, Oyo, Nigeria',
    linkedinUrl: '',
    githubUrl: '',
    summary: 'Full-stack developer specializing in MERN and Angular architectures.'
  },
  experience: [
    {
      company: 'Ennovate Lab',
      role: 'Software Development Intern',
      location: 'Oyo, Nigeria',
      startDate: 'Oct 2025',
      endDate: 'Dec 2025',
      isCurrent: false,
      bulletPoints: ['Developed and deployed full-stack web applications.']
    }
  ],
  education: [
    {
      institution: 'SQI College of ICT',
      degree: 'National Diploma',
      fieldOfStudy: 'Computer Science',
      graduationYear: '2026'
    }
  ],
  projects: [
    {
      name: 'ProTech',
      description: 'Automated web-based rent tracking platform',
      techStack: ['React', 'Node.js', 'PostgreSQL'],
      liveUrl: ''
    }
  ],
  skills: ['React', 'Node.js', 'PostgreSQL', 'MERN Stack', 'Angular']
};

export const CVBuilder = () => {
  const [resumeId, setResumeId] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Saved');
  const isInitialLoad = useRef(true);
  const resumeIdRef = useRef(null);
  const blobUrlRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  const {
    register,
    control,
    reset,
    watch,
    getValues,
    setValue,
    formState: { errors, isValid }
  } = useForm({
    resolver: zodResolver(resumeSchema),
    defaultValues: DEFAULT_RESUME_VALUES,
    mode: 'onChange'
  });

  // Dynamic field arrays
  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience
  } = useFieldArray({
    control,
    name: 'experience'
  });

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation
  } = useFieldArray({
    control,
    name: 'education'
  });

  const {
    fields: projectFields,
    append: appendProject,
    remove: removeProject
  } = useFieldArray({
    control,
    name: 'projects'
  });

  // Keep ref updated
  useEffect(() => {
    resumeIdRef.current = resumeId;
  }, [resumeId]);

  // Function to fetch the PDF blob preview
  const fetchPdfPreview = useCallback(async (id) => {
    const targetId = id || resumeIdRef.current;
    if (!targetId) return;

    try {
      setIsPdfLoading(true);
      const response = await axiosClient.get(`/api/resumes/${targetId}/preview.pdf`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const newBlobUrl = URL.createObjectURL(blob);

      setPdfBlobUrl((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return newBlobUrl;
      });
      blobUrlRef.current = newBlobUrl;
    } catch (err) {
      console.error('Failed to fetch PDF preview:', err);
    } finally {
      setIsPdfLoading(false);
    }
  }, []);

  // Initial load: Fetch resumes or create default
  useEffect(() => {
    let isMounted = true;

    const initializeResume = async () => {
      try {
        const { data: resumes } = await axiosClient.get('/api/resumes');

        if (Array.isArray(resumes) && resumes.length > 0) {
          const currentResume = resumes[0];
          if (isMounted) {
            setResumeId(currentResume._id);
            resumeIdRef.current = currentResume._id;
            reset(currentResume);
            fetchPdfPreview(currentResume._id);
          }
        } else {
          // Create default resume
          const { data: created } = await axiosClient.post('/api/resumes', DEFAULT_RESUME_VALUES);
          if (isMounted) {
            setResumeId(created._id);
            resumeIdRef.current = created._id;
            reset(created);
            fetchPdfPreview(created._id);
          }
        }
      } catch (err) {
        console.error('Error initializing resume:', err);
      } finally {
        setTimeout(() => {
          isInitialLoad.current = false;
        }, 500);
      }
    };

    initializeResume();

    return () => {
      isMounted = false;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [reset, fetchPdfPreview]);

  // Debounced auto-save using watch subscription
  useEffect(() => {
    const subscription = watch(() => {
      if (isInitialLoad.current || !resumeIdRef.current || !isValid) {
        return;
      }

      setSaveStatus('Saving...');
      clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const payload = getValues();
          await axiosClient.put(`/api/resumes/${resumeIdRef.current}`, payload);
          setSaveStatus('Saved');
          fetchPdfPreview(resumeIdRef.current);
        } catch (err) {
          console.error('Auto-save error:', err);
          setSaveStatus('Error saving');
        }
      }, 1000);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(saveTimeoutRef.current);
    };
  }, [watch, isValid, getValues, fetchPdfPreview]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* LEFT COLUMN: Form - 50% width */}
      <div className="w-1/2 p-8 overflow-y-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CV / Resume Builder</h1>
            <p className="text-xs text-gray-500">ATS Single-Column Format</p>
          </div>
          <div className="text-xs font-medium">
            {saveStatus === 'Saving...' ? (
              <span className="text-amber-600">Saving changes...</span>
            ) : saveStatus === 'Saved' ? (
              <span className="text-emerald-600">All changes saved</span>
            ) : (
              <span className="text-red-500">{saveStatus}</span>
            )}
          </div>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="pb-12">
          {/* Resume Document Title */}
          <div className="mt-6">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Resume Document Title
            </label>
            <input
              {...register('title')}
              className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. My Resume"
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Section: Personal Information */}
          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-gray-200">
            Personal Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">Full Name</label>
              <input
                {...register('personalInfo.fullName')}
                className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Amoo Halleluyah Olamilekan"
              />
              {errors.personalInfo?.fullName && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.personalInfo.fullName.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  {...register('personalInfo.email')}
                  className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="test@example.com"
                />
                {errors.personalInfo?.email && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.personalInfo.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Phone Number</label>
                <input
                  {...register('personalInfo.phone')}
                  className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+2340000000000"
                />
                {errors.personalInfo?.phone && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.personalInfo.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">Location</label>
              <input
                {...register('personalInfo.location')}
                className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ogbomoso, Oyo, Nigeria"
              />
              {errors.personalInfo?.location && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.personalInfo.location.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">LinkedIn URL</label>
                <input
                  {...register('personalInfo.linkedinUrl')}
                  className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://linkedin.com/in/username"
                />
                {errors.personalInfo?.linkedinUrl && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.personalInfo.linkedinUrl.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">GitHub URL</label>
                <input
                  {...register('personalInfo.githubUrl')}
                  className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://github.com/username"
                />
                {errors.personalInfo?.githubUrl && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.personalInfo.githubUrl.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">Professional Summary</label>
              <textarea
                rows={3}
                {...register('personalInfo.summary')}
                className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Full-stack developer specializing in MERN and Angular architectures."
              />
              {errors.personalInfo?.summary && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.personalInfo.summary.message}
                </p>
              )}
            </div>
          </div>

          {/* Section: Work Experience */}
          <div className="flex items-center justify-between mt-8 mb-4 pb-2 border-b border-gray-200">
            <h2 className="text-xl font-bold">Work Experience</h2>
            <button
              type="button"
              onClick={() =>
                appendExperience({
                  company: '',
                  role: '',
                  location: '',
                  startDate: '',
                  endDate: '',
                  isCurrent: false,
                  bulletPoints: ['']
                })
              }
              className="bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 text-sm font-medium transition-colors cursor-pointer"
            >
              + Add Experience
            </button>
          </div>

          <div className="space-y-6">
            {experienceFields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 bg-white rounded-lg border border-gray-200 space-y-4 relative"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-600">
                    Experience #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExperience(index)}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Company</label>
                    <input
                      {...register(`experience.${index}.company`)}
                      className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ennovate Lab"
                    />
                    {errors.experience?.[index]?.company && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.experience[index].company.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700">Role / Title</label>
                    <input
                      {...register(`experience.${index}.role`)}
                      className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Software Development Intern"
                    />
                    {errors.experience?.[index]?.role && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.experience[index].role.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Location</label>
                    <input
                      {...register(`experience.${index}.location`)}
                      className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Oyo, Nigeria"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700">Start Date</label>
                    <input
                      {...register(`experience.${index}.startDate`)}
                      className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Oct 2025"
                    />
                    {errors.experience?.[index]?.startDate && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.experience[index].startDate.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700">End Date</label>
                    <input
                      {...register(`experience.${index}.endDate`)}
                      className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Dec 2025"
                    />
                  </div>
                </div>

                {/* Bullet Points */}
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Key Bullet Points (one per line)
                  </label>
                  <textarea
                    rows={3}
                    defaultValue={field.bulletPoints?.join('\n') || ''}
                    onChange={(e) => {
                      const lines = e.target.value
                        .split('\n')
                        .map((l) => l.trim())
                        .filter(Boolean);
                      setValue(`experience.${index}.bulletPoints`, lines, {
                        shouldValidate: true
                      });
                    }}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Developed and deployed full-stack web applications."
                  />
                  {errors.experience?.[index]?.bulletPoints && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.experience[index].bulletPoints.message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Section: Education */}
          <div className="flex items-center justify-between mt-8 mb-4 pb-2 border-b border-gray-200">
            <h2 className="text-xl font-bold">Education</h2>
            <button
              type="button"
              onClick={() =>
                appendEducation({
                  institution: '',
                  degree: '',
                  fieldOfStudy: '',
                  graduationYear: ''
                })
              }
              className="bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 text-sm font-medium transition-colors cursor-pointer"
            >
              + Add Education
            </button>
          </div>

          <div className="space-y-6">
            {educationFields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 bg-white rounded-lg border border-gray-200 space-y-4 relative"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-600">
                    Education #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeEducation(index)}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Institution</label>
                    <input
                      {...register(`education.${index}.institution`)}
                      className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="SQI College of ICT"
                    />
                    {errors.education?.[index]?.institution && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.education[index].institution.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700">Degree</label>
                    <input
                      {...register(`education.${index}.degree`)}
                      className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="National Diploma"
                    />
                    {errors.education?.[index]?.degree && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.education[index].degree.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Field of Study
                    </label>
                    <input
                      {...register(`education.${index}.fieldOfStudy`)}
                      className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Computer Science"
                    />
                    {errors.education?.[index]?.fieldOfStudy && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.education[index].fieldOfStudy.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Graduation Year
                    </label>
                    <input
                      {...register(`education.${index}.graduationYear`)}
                      className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="2026"
                    />
                    {errors.education?.[index]?.graduationYear && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.education[index].graduationYear.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Section: Projects */}
          <div className="flex items-center justify-between mt-8 mb-4 pb-2 border-b border-gray-200">
            <h2 className="text-xl font-bold">Projects</h2>
            <button
              type="button"
              onClick={() =>
                appendProject({
                  name: '',
                  description: '',
                  techStack: [],
                  liveUrl: ''
                })
              }
              className="bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 text-sm font-medium transition-colors cursor-pointer"
            >
              + Add Project
            </button>
          </div>

          <div className="space-y-6">
            {projectFields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 bg-white rounded-lg border border-gray-200 space-y-4 relative"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-600">
                    Project #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeProject(index)}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Project Name</label>
                    <input
                      {...register(`projects.${index}.name`)}
                      className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ProTech"
                    />
                    {errors.projects?.[index]?.name && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.projects[index].name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700">Live URL</label>
                    <input
                      {...register(`projects.${index}.liveUrl`)}
                      className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://protech.app"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">Description</label>
                  <textarea
                    rows={2}
                    {...register(`projects.${index}.description`)}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Automated web-based rent tracking platform"
                  />
                  {errors.projects?.[index]?.description && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.projects[index].description.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Tech Stack (comma-separated)
                  </label>
                  <input
                    defaultValue={field.techStack?.join(', ') || ''}
                    onChange={(e) => {
                      const tags = e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      setValue(`projects.${index}.techStack`, tags, { shouldValidate: true });
                    }}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="React, Node.js, PostgreSQL"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Section: Skills */}
          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-gray-200">
            Skills
          </h2>
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Core Skills (comma-separated)
            </label>
            <input
              defaultValue={DEFAULT_RESUME_VALUES.skills.join(', ')}
              onChange={(e) => {
                const items = e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean);
                setValue('skills', items, { shouldValidate: true });
              }}
              className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="React, Node.js, PostgreSQL, MERN Stack, Angular"
            />
            {errors.skills && (
              <p className="text-xs text-red-500 mt-1">{errors.skills.message}</p>
            )}
          </div>
        </form>
      </div>

      {/* RIGHT COLUMN: PDF Preview - 50% width */}
      <div className="w-1/2 bg-gray-200 border-l border-gray-300 p-6 flex flex-col items-center justify-center">
        {pdfBlobUrl && !isPdfLoading ? (
          <iframe
            src={pdfBlobUrl}
            className="w-full h-full rounded-lg shadow-xl border-0 bg-white"
            title="Resume PDF Preview"
          />
        ) : (
          <div className="animate-pulse text-gray-500">
            Generating ATS PDF...
          </div>
        )}
      </div>
    </div>
  );
};

export default CVBuilder;
