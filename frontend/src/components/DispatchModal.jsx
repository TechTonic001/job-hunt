import { useState, useEffect } from 'react';
import { Loader2, Send, CheckCircle, X } from 'lucide-react';
import axiosClient from '../api/axiosClient.js';

const extractErrorMessage = (err, fallbackMessage) => {
  const data = err?.response?.data;
  if (!data) return err?.message || fallbackMessage;
  if (typeof data.error === 'string') return data.error;
  if (data.error && typeof data.error.message === 'string') return data.error.message;
  if (typeof data.message === 'string') return data.message;
  return fallbackMessage;
};

export const DispatchModal = ({ isOpen, onClose, job }) => {
  const [status, setStatus] = useState('drafting');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen || !job) {
      return;
    }

    let isMounted = true;

    const fetchDraft = async () => {
      setStatus('drafting');
      setErrorMessage('');

      try {
        const response = await axiosClient.post('/api/jobs/draft', {
          jobTitle: job.title,
          companyName: job.company,
          jobDescription: job.description || undefined
        });

        if (isMounted) {
          const generatedSubject =
            response.data?.subject ||
            response.data?.coverEmailSubject ||
            '';
          const generatedBody =
            response.data?.body ||
            response.data?.coverEmailBody ||
            '';

          setSubject(generatedSubject);
          setBody(generatedBody);
          setStatus('review');
        }
      } catch (err) {
        if (isMounted) {
          const message = extractErrorMessage(
            err,
            'Failed to generate draft cover letter. Please try again.'
          );
          setErrorMessage(message);
          setStatus('error');
        }
      }
    };

    fetchDraft();

    return () => {
      isMounted = false;
    };
  }, [isOpen, job]);

  if (!isOpen || !job) {
    return null;
  }

  const handleSend = async () => {
    setStatus('dispatching');
    setErrorMessage('');

    try {
      await axiosClient.post('/api/jobs/dispatch', {
        subject,
        body,
        applyEmail: job.applyEmail || job.apply_email || job.email || '',
        jobTitle: job.title,
        companyName: job.company
      });

      setStatus('success');
    } catch (err) {
      const message = extractErrorMessage(
        err,
        'Failed to dispatch application via Gmail API.'
      );
      setErrorMessage(message);
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111116] text-gray-100 shadow-[0_0_30px_rgba(99,102,241,0.12)]">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="pr-4">
            <h2 className="text-lg font-bold leading-snug text-gray-100">
              {job.title}
            </h2>
            <p className="text-sm text-gray-400">{job.company}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-gray-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {status === 'drafting' && (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 min-h-[350px]">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
              <p className="font-medium text-gray-300">
                Gemini is writing your cover letter...
              </p>
            </div>
          )}

          {status === 'review' && (
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-300">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Application Subject"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-300">
                  Cover Letter Body
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="min-h-[300px] w-full resize-y rounded-lg border border-white/10 bg-white/5 p-3 text-sm leading-relaxed text-gray-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Cover letter contents..."
                />
              </div>
            </div>
          )}

          {status === 'dispatching' && (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 min-h-[350px]">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
              <p className="font-medium text-gray-300">
                Dispatching via Gmail API...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 min-h-[350px]">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="text-lg font-bold text-gray-100">
                Application Sent Successfully!
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 cursor-pointer rounded-lg border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10"
              >
                Close
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 min-h-[350px]">
              <p className="font-medium text-rose-300">
                {typeof errorMessage === 'string'
                  ? errorMessage
                  : errorMessage?.message || 'An unexpected error occurred.'}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Footer (Only visible in 'review' state) */}
        {status === 'review' && (
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-white/10 bg-black/20 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Send className="w-4 h-4" />
              <span>Send Application</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DispatchModal;
