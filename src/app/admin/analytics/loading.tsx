export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse text-white">
      <div className="h-20 bg-white/5 rounded-3xl w-1/2 mb-12" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white/5 rounded-[32px] border border-white/5" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-12">
        <div className="xl:col-span-2 h-[500px] bg-white/5 rounded-[40px] border border-white/5" />
        <div className="h-[500px] bg-white/5 rounded-[40px] border border-white/5" />
      </div>
      <div className="h-[400px] bg-white/5 rounded-[40px] border border-white/5" />
    </div>
  );
}
