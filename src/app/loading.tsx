export default function RouteLoading() {
  return (
    <div className="min-h-screen md-page bg-mesh flex items-center justify-center text-emerald-900">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-emerald-900/20 border-t-amber-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="font-medium">Loading…</p>
      </div>
    </div>
  );
}
