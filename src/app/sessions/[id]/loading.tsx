export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 animate-pulse text-white">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 bg-white/5 rounded-2xl mb-8" />
        <div className="h-6 bg-white/5 rounded-xl w-48 mb-4" />
        <div className="h-4 bg-white/5 rounded-xl w-32" />
      </div>
    </div>
  );
}
