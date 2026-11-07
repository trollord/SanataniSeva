"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center text-center gap-4">
      <h2 className="text-2xl font-semibold text-gray-800">Admin panel error</h2>
      <p className="text-gray-500 max-w-md">
        {error.message || "Something went wrong in the admin panel. Please try again."}
      </p>
      <button
        onClick={reset}
        className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
