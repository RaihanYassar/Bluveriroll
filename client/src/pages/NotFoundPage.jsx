import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center space-y-4">
      <h1 className="text-6xl font-black text-cyan-400">404</h1>
      <h2 className="text-xl font-bold text-white">Page Not Found</h2>
      <p className="text-xs text-slate-400 max-w-sm">
        The movie or page you are looking for might have been moved or does not exist.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition"
      >
        <Compass className="w-4 h-4" />
        <span>Back to Discovery</span>
      </Link>
    </div>
  );
}

