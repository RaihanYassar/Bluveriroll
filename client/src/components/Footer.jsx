import { Film } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-300">BLUVERIROLL</span>
          <span className="text-slate-600">|</span>
          <span>Movie & Anime Discovery Platform</span>
        </div>
        <p>© {new Date().getFullYear()} BLUVERIROLL. All rights reserved.</p>
      </div>
    </footer>
  );
}


