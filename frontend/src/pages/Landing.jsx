import { ArrowRight, BriefcaseBusiness, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Landing = () => {
  const navigate = useNavigate();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090b] px-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.2),transparent_55%)]" />
      <div className="relative max-w-3xl">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300 shadow-[0_0_40px_rgba(99,102,241,0.18)]">
          <BriefcaseBusiness className="h-8 w-8" />
        </div>
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-indigo-200 backdrop-blur-md">
          <Sparkles className="h-4 w-4 text-cyan-300" />
          Your next role, matched to your strengths
        </p>
        <h1 className="text-5xl font-bold tracking-tight text-gray-100 sm:text-7xl">
          Build your CV.
          <span className="mt-2 block bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
            Find your next move.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-400">
          Create a polished resume and discover live opportunities matched to your skills.
        </p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="mt-10 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all hover:bg-indigo-500"
        >
          Get started
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </main>
  );
};

export default Landing;
