export const Login = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Sign In
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Sign in to access your resumes and tailored applications.
        </p>
      </div>
    </div>
  );
};

export default Login;
