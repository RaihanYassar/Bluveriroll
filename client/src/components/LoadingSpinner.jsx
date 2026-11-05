export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-3">
      <div className="w-9 h-9 rounded-full border-2 border-slate-800 border-t-cyan-400 animate-spin" />
      <p className="text-xs text-slate-400 font-medium">{text}</p>
    </div>
  );
}

