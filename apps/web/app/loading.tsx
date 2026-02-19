export default function Loading() {
  return (
    <main className="min-h-screen">
      {/* Hero skeleton */}
      <div className="relative min-h-[60vh] bg-navy overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="w-36 h-6 rounded-full shimmer mb-6" />
          <div className="w-3/4 h-12 rounded-xl shimmer mb-4" />
          <div className="w-1/2 h-12 rounded-xl shimmer mb-6" />
          <div className="w-2/3 h-6 rounded-lg shimmer" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl shimmer" />
              <div className="w-3/4 h-5 rounded shimmer" />
              <div className="w-full h-4 rounded shimmer" />
              <div className="w-2/3 h-4 rounded shimmer" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
