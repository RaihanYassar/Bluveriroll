export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 gap-3">
      <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
      <span className="text-xs text-slate-400 font-medium">{text}</span>
    </div>
  );
}

