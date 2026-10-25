import { AuthProvider } from './context/AuthContext';
import { Landing } from './pages';

function App() {
  return (
    <AuthProvider>
      <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-center items-center">
        <Landing />
      </main>
    </AuthProvider>
  );
}

export default App;
