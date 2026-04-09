export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0d0d1a] flex flex-col items-center justify-center p-6 animate-pulse">
      <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl mb-8" />
      <div className="h-8 bg-white/5 rounded-xl w-64 mb-4" />
      <div className="h-4 bg-white/5 rounded-xl w-48" />
    </div>
  );
}
