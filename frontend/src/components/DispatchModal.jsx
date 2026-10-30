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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="pr-4">
            <h2 className="text-lg font-bold text-gray-900 leading-snug">
              {job.title}
            </h2>
            <p className="text-sm text-gray-500">{job.company}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {status === 'drafting' && (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 min-h-[350px]">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <p className="text-gray-600 font-medium">
                Gemini is writing your cover letter...
              </p>
            </div>
          )}

          {status === 'review' && (
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Application Subject"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Cover Letter Body
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[300px] leading-relaxed resize-y"
                  placeholder="Cover letter contents..."
                />
              </div>
            </div>
          )}

          {status === 'dispatching' && (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 min-h-[350px]">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <p className="text-gray-600 font-medium">
                Dispatching via Gmail API...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 min-h-[350px]">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="text-lg font-bold text-gray-900">
                Application Sent Successfully!
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 min-h-[350px]">
              <p className="text-red-600 font-medium">
                {typeof errorMessage === 'string'
                  ? errorMessage
                  : errorMessage?.message || 'An unexpected error occurred.'}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Footer (Only visible in 'review' state) */}
        {status === 'review' && (
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
