import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { BriefcaseBusiness, FileText, Bookmark, Settings, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { auth } from '../services/firebase.js';

const navigation = [
  { label: 'Job Feed', to: '/jobs', icon: BriefcaseBusiness },
  { label: 'CV Builder', to: '/cv-builder', icon: FileText },
  { label: 'Saved Jobs', to: '/saved-jobs', icon: Bookmark },
  { label: 'Settings', to: '/settings', icon: Settings }
];

export const DashboardLayout = () => {
  const { currentUser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign Out Error:', error);
    }
  };

  const displayName = currentUser?.displayName || currentUser?.email || 'Your account';
  const initials = displayName
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  const sidebar = (
    <div className="flex h-full flex-col bg-[#09090b]">
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
        <Link to="/jobs" className="flex items-center gap-3 text-lg font-bold tracking-tight text-gray-100">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
            <BriefcaseBusiness className="h-5 w-5" />
          </span>
          ProTech Jobs
        </Link>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(false)}
          className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white md:hidden"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav aria-label="Main navigation" className="flex-1 space-y-1 px-3 py-6">
        <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-gray-600">Workspace</p>
        {navigation.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-500/10 text-indigo-300'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-100'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-semibold text-indigo-200">
            {initials || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-200">{displayName}</p>
            <p className="truncate text-xs text-gray-500">Job seeker</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-200"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-200">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 md:block">
        {sidebar}
      </aside>

      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden ${
          isMobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-white/10 transition-transform md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile navigation"
      >
        {sidebar}
      </aside>

      <div className="min-h-screen md:ml-64">
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-white/10 bg-[#09090b]/90 px-4 backdrop-blur-xl md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="rounded-lg p-2 text-gray-300 hover:bg-white/5"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-3 text-sm font-semibold text-gray-100">ProTech Jobs</span>
        </header>
        <main className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 md:min-h-screen md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
