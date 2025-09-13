export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            SPTM Web Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Smart Public Transport Management System
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Admin Panel</h2>
            <p className="text-gray-600">
              Manage system settings, users, and overall operations.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Company Dashboard</h2>
            <p className="text-gray-600">
              Monitor fleet performance, routes, and analytics.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Real-time Tracking</h2>
            <p className="text-gray-600">
              Track vehicles and monitor passenger flow in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}