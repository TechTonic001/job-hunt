/* oxlint-disable react/incompatible-library */
import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Upload, Loader2 } from 'lucide-react';
import axiosClient from '../api/axiosClient.js';

const DEFAULT_RESUME_VALUES = {
  fullName: 'Amoo Halleluyah Olamilekan',
  personalInfo: {
    email: 'test@example.com',
    phone: '+2340000000000',
    location: 'Ogbomoso, Oyo, Nigeria',
    github: '',
    linkedin: ''
  },
  summary: 'Full-stack software developer specializing in MERN, Angular, and PostgreSQL architectures.',
  experience: [
    {
      company: 'Ennovate Lab',
      role: 'Software Development Intern (SIWES)',
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
  const [resumeId, setResumeId] = useState('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const isInitialLoad = useRef(true);
  const saveTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const { register, control, reset, watch, setValue } = useForm({
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

  // Fetch PDF blob preview and set URL
  const fetchPdfPreview = useCallback(async (id) => {
    const targetId = id || resumeId;
    if (!targetId) return;

    try {
      const response = await axiosClient.get(`/api/resumes/${targetId}/preview.pdf`, {
        responseType: 'blob'
      });
      const blobUrl = URL.createObjectURL(response.data);
      setPdfBlobUrl(blobUrl);
    } catch (err) {
      console.error('Failed to fetch PDF preview:', err);
    }
  }, [resumeId]);

  // Lifecycle on mount: Fetch or create default resume
  useEffect(() => {
    let isMounted = true;

    const initResume = async () => {
      try {
        const { data: resumes } = await axiosClient.get('/api/resumes');

        if (Array.isArray(resumes) && resumes.length > 0) {
          const existing = resumes[0];
          if (isMounted) {
            setResumeId(existing._id);
            reset({
              fullName: existing.personalInfo?.fullName || DEFAULT_RESUME_VALUES.fullName,
              summary: existing.personalInfo?.summary || DEFAULT_RESUME_VALUES.summary,
              personalInfo: {
                email: existing.personalInfo?.email || DEFAULT_RESUME_VALUES.personalInfo.email,
                phone: existing.personalInfo?.phone || DEFAULT_RESUME_VALUES.personalInfo.phone,
                location: existing.personalInfo?.location || DEFAULT_RESUME_VALUES.personalInfo.location,
                github: existing.personalInfo?.githubUrl || existing.personalInfo?.github || '',
                linkedin: existing.personalInfo?.linkedinUrl || existing.personalInfo?.linkedin || ''
              },
              experience: existing.experience?.length ? existing.experience : DEFAULT_RESUME_VALUES.experience,
              education: existing.education?.length ? existing.education : DEFAULT_RESUME_VALUES.education,
              projects: existing.projects?.length ? existing.projects : DEFAULT_RESUME_VALUES.projects,
              skills: existing.skills?.length ? existing.skills : DEFAULT_RESUME_VALUES.skills
            });
          }
        } else {
          const createPayload = {
            title: 'My Resume',
            personalInfo: {
              fullName: DEFAULT_RESUME_VALUES.fullName,
              email: DEFAULT_RESUME_VALUES.personalInfo.email,
              phone: DEFAULT_RESUME_VALUES.personalInfo.phone,
              location: DEFAULT_RESUME_VALUES.personalInfo.location,
              linkedinUrl: DEFAULT_RESUME_VALUES.personalInfo.linkedin,
              githubUrl: DEFAULT_RESUME_VALUES.personalInfo.github,
              summary: DEFAULT_RESUME_VALUES.summary
            },
            experience: DEFAULT_RESUME_VALUES.experience,
            education: DEFAULT_RESUME_VALUES.education,
            projects: DEFAULT_RESUME_VALUES.projects,
            skills: DEFAULT_RESUME_VALUES.skills
          };
          const { data: created } = await axiosClient.post('/api/resumes', createPayload);
          if (isMounted) {
            setResumeId(created._id);
          }
        }
      } catch (err) {
        console.error('Error initializing resume on mount:', err);
      } finally {
        setTimeout(() => {
          isInitialLoad.current = false;
        }, 500);
      }
    };

    initResume();

    return () => {
      isMounted = false;
    };
  }, [reset]);

  // Fetch initial PDF when resumeId is set
  useEffect(() => {
    if (resumeId) {
      fetchPdfPreview(resumeId);
    }
  }, [resumeId, fetchPdfPreview]);

  // Auto-Save effect: Debounced 1000ms
  useEffect(() => {
    if (!resumeId) return;

    const subscription = watch((formData) => {
      if (isInitialLoad.current) {
        return;
      }

      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          setIsSaving(true);
          const payload = {
            title: 'My Resume',
            personalInfo: {
              fullName: formData.fullName || formData.personalInfo?.fullName || 'Amoo Halleluyah Olamilekan',
              email: formData.personalInfo?.email || 'test@example.com',
              phone: formData.personalInfo?.phone || '+2340000000000',
              location: formData.personalInfo?.location || 'Ogbomoso, Oyo, Nigeria',
              linkedinUrl: formData.personalInfo?.linkedin || '',
              githubUrl: formData.personalInfo?.github || '',
              summary: formData.summary || formData.personalInfo?.summary || ''
            },
            experience: Array.isArray(formData.experience) ? formData.experience : [],
            education: Array.isArray(formData.education) ? formData.education : [],
            projects: Array.isArray(formData.projects) ? formData.projects : [],
            skills: Array.isArray(formData.skills) ? formData.skills : []
          };

          await axiosClient.put(`/api/resumes/${resumeId}`, payload);
          setIsSaving(false);
          fetchPdfPreview(resumeId);
        } catch (err) {
          console.error('Auto-save error:', err);
          setIsSaving(false);
        }
      }, 1000);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(saveTimeoutRef.current);
    };
  }, [watch, resumeId, fetchPdfPreview]);

  // AI Import: parse a PDF resume and populate all form fields instantly
  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await axiosClient.post('/api/resumes/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const d = response.data;

      // Normalise the AI response before resetting the form
      reset({
        fullName: d.fullName || '',
        personalInfo: {
          email: d.personalInfo?.email || '',
          phone: d.personalInfo?.phone || '',
          location: d.personalInfo?.location || '',
          github: d.personalInfo?.github || d.personalInfo?.githubUrl || '',
          linkedin: d.personalInfo?.linkedin || d.personalInfo?.linkedinUrl || ''
        },
        summary: d.summary || '',
        experience: Array.isArray(d.experience)
          ? d.experience.map((exp) => ({
              company: exp.company || '',
              role: exp.role || '',
              startDate: exp.startDate || '',
              endDate: exp.endDate || '',
              isCurrent: exp.isCurrent || false,
              bulletPoints: Array.isArray(exp.bulletPoints) ? exp.bulletPoints : []
            }))
          : [],
        education: Array.isArray(d.education)
          ? d.education.map((edu) => ({
              institution: edu.institution || '',
              degree: edu.degree || '',
              fieldOfStudy: edu.fieldOfStudy || '',
              graduationYear: edu.graduationYear || ''
            }))
          : [],
        projects: Array.isArray(d.projects)
          ? d.projects.map((proj) => ({
              name: proj.name || '',
              description: proj.description || '',
              techStack: Array.isArray(proj.techStack) ? proj.techStack : [],
              liveUrl: proj.liveUrl || ''
            }))
          : [],
        skills: Array.isArray(d.skills) ? d.skills : []
      });
    } catch (err) {
      console.error('Import failed:', err);
      alert(err?.response?.data?.error || 'Failed to import resume. Please try again.');
    } finally {
      setIsImporting(false);
      // Reset the file input so the same file can be re-imported if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Left Column (Form) */}
      <div className="w-1/2 p-8 overflow-y-auto">
        {/* Hidden file input — triggered by the Import button */}
        <input
          type="file"
          accept=".pdf"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImport}
        />

        <div className="flex items-center justify-between pb-4 mb-2 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CV / Resume Builder</h1>
            <p className="text-xs text-gray-500">ATS Single-Column Format</p>
          </div>
          <div className="flex items-center gap-3">
            {/* AI Import Button */}
            <button
              type="button"
              id="import-resume-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Parsing PDF with AI...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Import Resume
                </>
              )}
            </button>

            {/* Auto-save status */}
            {isSaving ? (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">
                Saving...
              </span>
            ) : (
              <span className="text-xs font-medium text-emerald-600">
                All changes saved
              </span>
            )}
          </div>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="pb-12">
          {/* Section: Personal Info */}
          <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-gray-200">
            Personal Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">Full Name</label>
              <input
                {...register('fullName')}
                className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                placeholder="Amoo Halleluyah Olamilekan"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  {...register('personalInfo.email')}
                  className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                  placeholder="test@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Phone Number</label>
                <input
                  {...register('personalInfo.phone')}
                  className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                  placeholder="+2340000000000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">Location</label>
              <input
                {...register('personalInfo.location')}
                className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                placeholder="Ogbomoso, Oyo, Nigeria"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">LinkedIn URL</label>
                <input
                  {...register('personalInfo.linkedin')}
                  className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">GitHub URL</label>
                <input
                  {...register('personalInfo.github')}
                  className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                  placeholder="https://github.com/username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">Professional Summary</label>
              <textarea
                rows={3}
                {...register('summary')}
                className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                placeholder="Full-stack software developer specializing in MERN, Angular, and PostgreSQL architectures."
              />
            </div>
          </div>

          {/* Section: Experience */}
          <div className="flex items-center justify-between mt-8 mb-4 pb-2 border-b border-gray-200">
            <h2 className="text-xl font-bold">Experience</h2>
            <button
              type="button"
              onClick={() =>
                appendExperience({
                  company: '',
                  role: '',
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
                      className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                      placeholder="Ennovate Lab"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700">Role / Title</label>
                    <input
                      {...register(`experience.${index}.role`)}
                      className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                      placeholder="Software Development Intern (SIWES)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Start Date</label>
                    <input
                      {...register(`experience.${index}.startDate`)}
                      className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                      placeholder="Oct 2025"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700">End Date</label>
                    <input
                      {...register(`experience.${index}.endDate`)}
                      className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                      placeholder="Dec 2025"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Bullet Points (one per line)
                  </label>
                  <textarea
                    rows={2}
                    defaultValue={field.bulletPoints?.join('\n') || ''}
                    onChange={(e) => {
                      const lines = e.target.value
                        .split('\n')
                        .map((l) => l.trim())
                        .filter(Boolean);
                      setValue(`experience.${index}.bulletPoints`, lines);
                    }}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                    placeholder="Developed and deployed full-stack web applications."
                  />
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
                      className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                      placeholder="SQI College of ICT"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700">Degree</label>
                    <input
                      {...register(`education.${index}.degree`)}
                      className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                      placeholder="National Diploma"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Field of Study
                    </label>
                    <input
                      {...register(`education.${index}.fieldOfStudy`)}
                      className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                      placeholder="Computer Science"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Graduation Year
                    </label>
                    <input
                      {...register(`education.${index}.graduationYear`)}
                      className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                      placeholder="2026"
                    />
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
                      className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                      placeholder="ProTech"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700">Live URL</label>
                    <input
                      {...register(`projects.${index}.liveUrl`)}
                      className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                      placeholder="https://protech.app"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">Description</label>
                  <textarea
                    rows={2}
                    {...register(`projects.${index}.description`)}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md"
                    placeholder="Automated web-based rent tracking platform"
                  />
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
                      setValue(`projects.${index}.techStack`, tags);
                    }}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md"
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
                setValue('skills', items);
              }}
              className="w-full p-2 mt-1 border border-gray-300 rounded-md"
              placeholder="React, Node.js, PostgreSQL, MERN Stack, Angular"
            />
          </div>
        </form>
      </div>

      {/* Right Column (PDF Preview) */}
      <div className="w-1/2 bg-gray-200 p-6 flex flex-col items-center justify-center border-l border-gray-300">
        {pdfBlobUrl ? (
          <iframe
            src={pdfBlobUrl}
            className="w-full h-full rounded-lg shadow-xl border-0 bg-white"
            title="Resume PDF Preview"
          />
        ) : (
          <div className="animate-pulse text-gray-500 font-medium">
            Generating PDF Preview...
          </div>
        )}
      </div>
    </div>
  );
};

export default CVBuilder;
