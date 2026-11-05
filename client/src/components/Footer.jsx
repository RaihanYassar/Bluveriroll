export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-8 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} BLUVERIROLL. Hacktiv8 Individual Project Phase 2.</p>
        <p className="flex items-center gap-2">
          <span>Powered by Jikan API</span>
          <span>•</span>
          <span>OpenAI</span>
          <span>•</span>
          <span>Supabase PostgreSQL</span>
        </p>
      </div>
    </footer>
  );
}

