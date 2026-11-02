import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient.js';
import JobCard from '../components/JobCard.jsx';

const extractErrorMessage = (err, fallbackMessage) => {
  const data = err?.response?.data;
  if (!data) return err?.message || fallbackMessage;
  if (typeof data.error === 'string') return data.error;
  if (data.error && typeof data.error.message === 'string') return data.error.message;
  if (typeof data.message === 'string') return data.message;
  return fallbackMessage;
};

export const JobFeed = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchMatchedJobs = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axiosClient.get('/api/jobs/match');
        if (isMounted) {
          setJobs(Array.isArray(response?.data) ? response.data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(extractErrorMessage(
            err,
            'Failed to search live jobs. Please try again.'
          ));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMatchedJobs();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">Live search</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-100">Recommended roles</h1>
        <p className="mt-2 text-gray-400">Global opportunities selected for your resume and skills.</p>
      </header>

      {loading && (
        <section className="space-y-4" aria-label="Loading job matches">
          <p className="text-gray-400">Searching global listings and matching them to your CV...</p>
          {[1, 2, 3].map((placeholder) => (
            <div
              key={placeholder}
              className="animate-pulse space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="h-6 w-2/3 rounded bg-white/10" />
              <div className="h-4 w-1/3 rounded bg-white/10" />
              <div className="h-4 w-full rounded bg-white/10" />
            </div>
          ))}
        </section>
      )}

      {!loading && error && (
        <div role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-300">
          {error}
        </div>
      )}

      {!loading && !error && (
        jobs.length > 0 ? (
          <section className="space-y-5">
            {jobs.map((job, index) => (
              <JobCard key={job.job_apply_link || index} job={job} />
            ))}
          </section>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-md">
            <p className="text-lg font-medium text-gray-200">No strong matches found</p>
            <p className="mt-2 text-sm text-gray-400">
              Try updating your CV skills or check back for new opportunities.
            </p>
          </div>
        )
      )}
    </main>
  );
};

export default JobFeed;
