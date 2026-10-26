import { NavLink, Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { Briefcase, FileText, LogOut, Sparkles } from 'lucide-react';
import { auth } from '../services/firebase.js';
import { useAuth } from '../context/AuthContext.jsx';

export const Navbar = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Navigation Bar is only visible when user is logged in
  if (!currentUser) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  const getNavLinkClass = ({ isActive }) =>
    `inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
      isActive
        ? 'bg-blue-600 text-white shadow-xs'
        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;

  const userInitial = currentUser?.email
    ? currentUser.email.charAt(0).toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link
              to="/jobs"
              className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base tracking-tight hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="hidden sm:inline">Job Assistant</span>
            </Link>

            {/* Nav Links */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <NavLink to="/cv-builder" className={getNavLinkClass}>
                <FileText className="w-4 h-4 shrink-0" />
                <span>CV Builder</span>
              </NavLink>
              <NavLink to="/jobs" className={getNavLinkClass}>
                <Briefcase className="w-4 h-4 shrink-0" />
                <span>Job Feed</span>
              </NavLink>
            </nav>
          </div>

          {/* User Profile & Sign Out */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User Profile'}
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                  {userInitial}
                </div>
              )}
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 hidden md:inline-block max-w-[160px] truncate">
                {currentUser?.displayName || currentUser?.email}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
