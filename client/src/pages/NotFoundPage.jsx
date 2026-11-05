import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-4">
      <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
        404
      </span>
      <h1 className="text-xl font-bold text-white">Page Not Found</h1>
      <p className="text-xs text-slate-400 max-w-sm">
        The page you are looking for does not exist or has been moved in the anime multiverse.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition mt-4"
      >
        <Compass className="w-4 h-4" />
        <span>Return to Home</span>
      </Link>
    </div>
  );
}

