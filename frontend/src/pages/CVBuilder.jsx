/* oxlint-disable react/incompatible-library */
import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axiosClient from '../api/axiosClient.js';
import { resumeSchema } from '../validators/resumeSchema.js';
import { Plus, Trash2, CheckCircle2, RefreshCw, FileText } from 'lucide-react';

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
    watch,
    reset,
    getValues,
    setValue,
    formState: { errors, isValid }
  } = useForm({
    resolver: zodResolver(resumeSchema),
    mode: 'onChange',
    defaultValues: DEFAULT_RESUME_VALUES
  });

  const {
    fields: expFields,
    append: appendExp,
    remove: removeExp
  } = useFieldArray({ control, name: 'experience' });

  const {
    fields: eduFields,
    append: appendEdu,
    remove: removeEdu
  } = useFieldArray({ control, name: 'education' });

  const {
    fields: projFields,
    append: appendProj,
    remove: removeProj
  } = useFieldArray({ control, name: 'projects' });

  // Update blobUrlRef whenever pdfBlobUrl changes for unmount cleanup
  useEffect(() => {
    blobUrlRef.current = pdfBlobUrl;
  }, [pdfBlobUrl]);

  // Keep resumeIdRef in sync with resumeId
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
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* LEFT COLUMN: Scrollable Form */}
      <div className="w-full lg:w-1/2 overflow-y-auto h-auto lg:h-screen p-6 lg:p-8 border-r border-slate-200 dark:border-slate-800">
        <header className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xs z-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">CV / Resume Builder</h1>
            <p className="text-xs text-slate-500">ATS Single-Column Format</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium">
            {saveStatus === 'Saving...' ? (
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
              </span>
            ) : saveStatus === 'Saved' ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> All changes saved
              </span>
            ) : (
              <span className="text-red-500">{saveStatus}</span>
            )}
          </div>
        </header>

        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
          {/* Resume Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Resume Document Title
            </label>
            <input
              {...register('title')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Full-Stack Developer Resume"
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          {/* Personal Information */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Full Name</label>
                <input
                  {...register('personalInfo.fullName')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                {errors.personalInfo?.fullName && (
                  <p className="text-xs text-red-500 mt-1">{errors.personalInfo.fullName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Email</label>
                <input
                  type="email"
                  {...register('personalInfo.email')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                {errors.personalInfo?.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.personalInfo.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Phone</label>
                <input
                  {...register('personalInfo.phone')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                {errors.personalInfo?.phone && (
                  <p className="text-xs text-red-500 mt-1">{errors.personalInfo.phone.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Location</label>
                <input
                  {...register('personalInfo.location')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                {errors.personalInfo?.location && (
                  <p className="text-xs text-red-500 mt-1">{errors.personalInfo.location.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">LinkedIn URL (optional)</label>
                <input
                  {...register('personalInfo.linkedinUrl')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">GitHub URL (optional)</label>
                <input
                  {...register('personalInfo.githubUrl')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Professional Summary</label>
              <textarea
                rows={3}
                {...register('personalInfo.summary')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </section>

          {/* Work Experience */}
          <section className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Work Experience
              </h2>
              <button
                type="button"
                onClick={() =>
                  appendExp({
                    company: '',
                    role: '',
                    location: '',
                    startDate: '',
                    endDate: '',
                    isCurrent: false,
                    bulletPoints: ['Developed high-performance components.']
                  })
                }
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Role
              </button>
            </div>

            {expFields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3 relative group"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500">Position #{index + 1}</span>
                  {expFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExp(index)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      title="Remove experience"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1">Company</label>
                    <input
                      {...register(`experience.${index}.company`)}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Role / Title</label>
                    <input
                      {...register(`experience.${index}.role`)}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Start Date</label>
                    <input
                      {...register(`experience.${index}.startDate`)}
                      placeholder="e.g. Oct 2025"
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">End Date</label>
                    <input
                      {...register(`experience.${index}.endDate`)}
                      placeholder="e.g. Dec 2025"
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs mb-1">Bullet Point Description</label>
                  <input
                    {...register(`experience.${index}.bulletPoints.0`)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    placeholder="Key impact or achievement (min 5 chars)"
                  />
                </div>
              </div>
            ))}
          </section>

          {/* Education */}
          <section className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Education
              </h2>
              <button
                type="button"
                onClick={() =>
                  appendEdu({
                    institution: '',
                    degree: '',
                    fieldOfStudy: '',
                    graduationYear: '2026'
                  })
                }
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Education
              </button>
            </div>

            {eduFields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3 relative"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500">Degree #{index + 1}</span>
                  {eduFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEdu(index)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1">Institution</label>
                    <input
                      {...register(`education.${index}.institution`)}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Degree</label>
                    <input
                      {...register(`education.${index}.degree`)}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Field of Study</label>
                    <input
                      {...register(`education.${index}.fieldOfStudy`)}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Graduation Year</label>
                    <input
                      {...register(`education.${index}.graduationYear`)}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Projects */}
          <section className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Key Projects
              </h2>
              <button
                type="button"
                onClick={() =>
                  appendProj({
                    name: '',
                    description: 'Automated platform with high availability and reliability.',
                    techStack: ['React', 'Node.js'],
                    liveUrl: ''
                  })
                }
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            </div>

            {projFields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3 relative"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500">Project #{index + 1}</span>
                  {projFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProj(index)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1">Project Name</label>
                    <input
                      {...register(`projects.${index}.name`)}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Live URL (optional)</label>
                    <input
                      {...register(`projects.${index}.liveUrl`)}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-1">Description (min 10 chars)</label>
                  <textarea
                    rows={2}
                    {...register(`projects.${index}.description`)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            ))}
          </section>

          {/* Skills */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800">
              Technical Skills
            </h2>
            <div>
              <label className="block text-xs mb-1 text-slate-500">
                Comma-separated skills (e.g. React, Node.js, PostgreSQL)
              </label>
              <input
                type="text"
                defaultValue={DEFAULT_RESUME_VALUES.skills.join(', ')}
                onChange={(e) => {
                  const items = e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  setValue('skills', items, { shouldValidate: true });
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              {errors.skills && (
                <p className="text-xs text-red-500 mt-1">{errors.skills.message}</p>
              )}
            </div>
          </section>
        </form>
      </div>

      {/* RIGHT COLUMN: PDF Preview Fixed */}
      <div className="w-full lg:w-1/2 h-[600px] lg:h-screen p-4 lg:p-6 bg-slate-100 dark:bg-slate-900 flex flex-col sticky top-0">
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold">Live ATS Preview</span>
          </div>
          {isPdfLoading && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Rendering PDF...
            </span>
          )}
        </div>

        <div className="flex-1 w-full h-full relative rounded-xl overflow-hidden bg-white shadow-md">
          {pdfBlobUrl ? (
            <iframe
              src={pdfBlobUrl}
              className="w-full h-full rounded-lg border-2 border-gray-200"
              title="Resume PDF Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              Generating PDF Preview...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CVBuilder;
