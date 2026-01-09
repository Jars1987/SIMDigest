export default function DatabaseError() {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-red-900 mb-2">
          Service Temporarily Unavailable
        </h2>
        <p className="text-red-700 mb-4">
          We're experiencing database connectivity issues. Please try again later.
        </p>
        <p className="text-sm text-red-600">
          If you're the administrator, please check your Supabase configuration and environment variables.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
