'use client';

import { useAuth } from '../contexts/AuthContext';
import { MultiTierLogin } from '../components/MultiTierLogin';
import { RoleBasedUI } from '../components/RoleBasedUI';

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-500 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated || !user) {
    return <MultiTierLogin />;
  }

  // Render the full dashboard with sidebar layout
  return <RoleBasedUI user={user} />;
}
