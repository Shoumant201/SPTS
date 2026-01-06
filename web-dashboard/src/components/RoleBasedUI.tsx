'use client';

import React, { useState } from 'react';
import { User, UserType } from '../services/api/auth';
import { DashboardLayout } from './DashboardLayout';
import { 
  SuperAdminDashboardContent, 
  AdminDashboardContent, 
  OrganizationDashboardContent 
} from './DashboardContent';
import { AdminManagement } from './AdminManagement';
import { OrganizationManagement } from './OrganizationManagement';
import { DriverManagement } from './DriverManagement';
import { ProfilePage } from './ProfilePage';
import { SettingsPage } from './SettingsPage';

interface RoleBasedUIProps {
  user: User;
  children?: React.ReactNode;
}

// Placeholder components for menus that don't exist yet
const PlaceholderPage: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
    <div className="text-center max-w-md mx-auto">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500">{description}</p>
    </div>
  </div>
);

const FleetManagement: React.FC = () => (
  <PlaceholderPage 
    title="Fleet Management" 
    description="Manage your vehicle fleet, track maintenance schedules, and monitor vehicle status. This feature is coming soon."
  />
);

const RoutesManagement: React.FC = () => (
  <PlaceholderPage 
    title="Routes Management" 
    description="Create and manage transit routes, set schedules, and optimize route efficiency. This feature is coming soon."
  />
);

const SchedulesManagement: React.FC = () => (
  <PlaceholderPage 
    title="Schedules Management" 
    description="Manage driver schedules, shift assignments, and time tracking. This feature is coming soon."
  />
);

const DriversManagement: React.FC = () => (
  <PlaceholderPage 
    title="Drivers Management" 
    description="Manage driver profiles, assignments, and performance tracking. This feature is coming soon."
  />
);

const ReportsPage: React.FC = () => (
  <PlaceholderPage 
    title="Reports & Analytics" 
    description="Generate detailed reports on fleet performance, revenue, and operational metrics. This feature is coming soon."
  />
);

const SettingsPageComponent: React.FC = () => <SettingsPage />;

const SupportPage: React.FC = () => (
  <PlaceholderPage 
    title="Support Center" 
    description="Get help with the system, view documentation, and contact support. This feature is coming soon."
  />
);

// Main Role-Based UI Component
export const RoleBasedUI: React.FC<RoleBasedUIProps> = ({ user, children }) => {
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        switch (user.userType) {
          case 'SUPER_ADMIN':
            return <SuperAdminDashboardContent user={user} />;
          case 'ADMIN':
            return <AdminDashboardContent user={user} />;
          case 'ORGANIZATION':
            return <OrganizationDashboardContent user={user} />;
          default:
            return <SuperAdminDashboardContent user={user} />;
        }
      case 'admins':
        return <AdminManagement />;
      case 'organizations':
        return <OrganizationManagement userType={user.userType as 'SUPER_ADMIN' | 'ADMIN'} />;
      case 'fleet':
        return <FleetManagement />;
      case 'routes':
        return <RoutesManagement />;
      case 'schedules':
        return <SchedulesManagement />;
      case 'drivers':
        return <DriverManagement />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPageComponent />;
      case 'profile':
        return <ProfilePage user={user} />;
      case 'support':
        return <SupportPage />;
      default:
        return <SuperAdminDashboardContent user={user} />;
    }
  };

  // Check if user type has access to web dashboard
  if (!['SUPER_ADMIN', 'ADMIN', 'ORGANIZATION'].includes(user.userType)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 max-w-md">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            Access Not Available
          </h2>
          <p className="text-sm text-yellow-700">
            This user type ({user.userType}) does not have access to the web dashboard.
            Please use the appropriate mobile application.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      activeMenu={activeMenu}
      onMenuChange={setActiveMenu}
    >
      {children || renderContent()}
    </DashboardLayout>
  );
};

// Hook to get user type specific navigation items
export const useRoleBasedNavigation = (userType: UserType) => {
  const navigationItems = React.useMemo(() => {
    switch (userType) {
      case 'SUPER_ADMIN':
        return [
          { name: 'Dashboard', href: '/dashboard', icon: '📊' },
          { name: 'Admin Management', href: '/admins', icon: '👤' },
          { name: 'Organizations', href: '/organizations', icon: '🏢' },
          { name: 'Fleet', href: '/fleet', icon: '🚌' },
          { name: 'Routes', href: '/routes', icon: '🛣️' },
          { name: 'Schedules', href: '/schedules', icon: '📅' },
          { name: 'Reports', href: '/reports', icon: '📈' },
          { name: 'Settings', href: '/settings', icon: '⚙️' },
        ];
      case 'ADMIN':
        return [
          { name: 'Dashboard', href: '/dashboard', icon: '📊' },
          { name: 'Organizations', href: '/organizations', icon: '🏢' },
          { name: 'Fleet', href: '/fleet', icon: '🚌' },
          { name: 'Routes', href: '/routes', icon: '🛣️' },
          { name: 'Schedules', href: '/schedules', icon: '📅' },
          { name: 'Reports', href: '/reports', icon: '📈' },
        ];
      case 'ORGANIZATION':
        return [
          { name: 'Dashboard', href: '/dashboard', icon: '📊' },
          { name: 'Fleet', href: '/fleet', icon: '🚌' },
          { name: 'Drivers', href: '/drivers', icon: '👤' },
          { name: 'Routes', href: '/routes', icon: '🛣️' },
          { name: 'Schedules', href: '/schedules', icon: '📅' },
          { name: 'Reports', href: '/reports', icon: '📈' },
        ];
      default:
        return [];
    }
  }, [userType]);

  return navigationItems;
};
