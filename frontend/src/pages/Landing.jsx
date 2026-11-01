import { useNavigate } from 'react-router-dom';

export const Landing = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
        Welcome to ProTech Jobs
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-xl">
        AI-powered CV building and automated job matching.
      </p>
      <button
        onClick={handleGetStarted}
        className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
      >
        Get Started
      </button>
    </div>
  );
};

export default Landing;
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
        ATS Resume Builder & Job Application Assistant
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
        AI-powered resume optimization tailored for Applicant Tracking Systems and streamlined job applications.
      </p>
    </div>
  );
};

export default Landing;
