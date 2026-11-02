import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase.js';

export const Navbar = () => {
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign Out Error:', err);
    }
  };

  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    return `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'text-indigo-300 bg-indigo-500/10 font-semibold'
        : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
    }`;
  };

  return (
    <nav className="border-b border-white/10 bg-[#09090b]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side: A bold logo text "ProTech Jobs" */}
          <div className="flex items-center">
            <Link to="/jobs" className="text-xl font-bold tracking-tight text-gray-100">
              ProTech Jobs
            </Link>
          </div>

          {/* Center: Links for "CV Builder" and "Job Feed" */}
          <div className="flex items-center space-x-4">
            <Link to="/cv-builder" className={getLinkClass('/cv-builder')}>
              CV Builder
            </Link>
            <Link to="/jobs" className={getLinkClass('/jobs')}>
              Job Feed
            </Link>
          </div>

          {/* Right side: A "Sign Out" button that calls signOut(auth) */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleSignOut}
              className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
