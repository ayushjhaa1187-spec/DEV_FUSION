export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse text-white">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="h-[500px] bg-[#13132b] rounded-[40px] border border-white/5" />
        <div className="lg:col-span-2 space-y-8">
          <div className="h-48 bg-[#13132b] rounded-3xl border border-white/5" />
          <div className="grid grid-cols-2 gap-8">
            <div className="h-48 bg-[#13132b] rounded-[40px] border border-white/5" />
            <div className="h-48 bg-[#13132b] rounded-[40px] border border-white/5" />
          </div>
          <div className="h-64 bg-[#13132b] rounded-[40px] border border-white/5" />
        </div>
      </div>
    </div>
  );
}
