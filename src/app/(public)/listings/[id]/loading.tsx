export default function PropertyDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-pulse">
      {/* Image placeholder */}
      <div className="w-full h-72 sm:h-96 bg-gray-200 rounded-xl mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-5 bg-gray-200 rounded w-1/2" />
          </div>

          {/* Price */}
          <div className="h-10 bg-gray-200 rounded w-40" />

          {/* Details row */}
          <div className="flex gap-4">
            <div className="h-6 bg-gray-200 rounded w-20" />
            <div className="h-6 bg-gray-200 rounded w-20" />
            <div className="h-6 bg-gray-200 rounded w-20" />
          </div>

          {/* Description lines */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="h-40 bg-gray-200 rounded-xl" />
          <div className="h-12 bg-gray-200 rounded-lg w-full" />
          <div className="h-12 bg-gray-200 rounded-lg w-full" />
        </div>
      </div>
    </div>
  );
}
