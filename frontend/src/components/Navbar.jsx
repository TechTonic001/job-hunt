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
        ? 'text-blue-600 bg-blue-50 font-semibold'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`;
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side: A bold logo text "ProTech Jobs" */}
          <div className="flex items-center">
            <Link to="/jobs" className="text-xl font-bold text-gray-900 tracking-tight">
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
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
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
