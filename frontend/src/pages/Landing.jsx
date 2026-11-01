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
