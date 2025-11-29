'use client';

import React from 'react';
import { User, UserType } from '../services/api/auth';

interface RoleBasedUIProps {
  user: User;
  children?: React.ReactNode;
}

interface DashboardContentProps {
  user: User;
}

// Super Admin Dashboard Component
const SuperAdminDashboard: React.FC<DashboardContentProps> = ({ user }) => {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-blue-800 mb-3">
          Super Admin Dashboard
        </h2>
        <div className="text-sm text-blue-700 space-y-2">
          <p><strong>Welcome, {user.name}!</strong></p>
          <p>You have full system access and can manage all aspects of the SPTM platform.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-2">System Management</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Manage Admin Accounts</li>
            <li>• System Configuration</li>
            <li>• Global Analytics</li>
            <li>• Security Settings</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-2">Organization Oversight</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• All Organizations</li>
            <li>• Cross-Organization Reports</li>
            <li>• Platform Metrics</li>
            <li>• Compliance Monitoring</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-2">User Management</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• All User Accounts</li>
            <li>• Role Management</li>
            <li>• Access Control</li>
            <li>• Audit Logs</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Admin Dashboard Component
const AdminDashboard: React.FC<DashboardContentProps> = ({ user }) => {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-green-800 mb-3">
          Admin Dashboard
        </h2>
        <div className="text-sm text-green-700 space-y-2">
          <p><strong>Welcome, {user.name}!</strong></p>
          <p>Manage organizations and oversee platform operations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-2">Organization Management</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Create Organizations</li>
            <li>• Manage Organization Accounts</li>
            <li>• Monitor Organization Performance</li>
            <li>• Route Oversight</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-2">Platform Operations</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Fleet Management</li>
            <li>• Driver Oversight</li>
            <li>• Service Quality Monitoring</li>
            <li>• Operational Reports</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Organization Dashboard Component
const OrganizationDashboard: React.FC<DashboardContentProps> = ({ user }) => {
  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-purple-800 mb-3">
          Organization Dashboard
        </h2>
        <div className="text-sm text-purple-700 space-y-2">
          <p><strong>Welcome, {user.name}!</strong></p>
          <p>Manage your fleet, drivers, and routes effectively.</p>
          {user.organizationId && (
            <p><strong>Organization ID:</strong> {user.organizationId}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-2">Fleet Management</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Vehicle Status</li>
            <li>• Maintenance Scheduling</li>
            <li>• Fleet Performance</li>
            <li>• Route Assignments</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-2">Driver Management</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Driver Profiles</li>
            <li>• Schedule Management</li>
            <li>• Performance Tracking</li>
            <li>• Earnings Overview</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Main Role-Based UI Component
export const RoleBasedUI: React.FC<RoleBasedUIProps> = ({ user, children }) => {
  const renderDashboard = () => {
    switch (user.userType) {
      case 'SUPER_ADMIN':
        return <SuperAdminDashboard user={user} />;
      case 'ADMIN':
        return <AdminDashboard user={user} />;
      case 'ORGANIZATION':
        return <OrganizationDashboard user={user} />;
      default:
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
              Access Not Available
            </h2>
            <p className="text-sm text-yellow-700">
              This user type ({user.userType}) does not have access to the web dashboard.
              Please use the appropriate mobile application.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {children || renderDashboard()}
    </div>
  );
};

// Hook to get user type specific navigation items
export const useRoleBasedNavigation = (userType: UserType) => {
  const navigationItems = React.useMemo(() => {
    switch (userType) {
      case 'SUPER_ADMIN':
        return [
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Admin Management', href: '/admins' },
          { name: 'Organizations', href: '/organizations' },
          { name: 'System Settings', href: '/settings' },
          { name: 'Analytics', href: '/analytics' },
          { name: 'Audit Logs', href: '/audit' },
        ];
      case 'ADMIN':
        return [
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Organizations', href: '/organizations' },
          { name: 'Routes', href: '/routes' },
          { name: 'Fleet Overview', href: '/fleet' },
          { name: 'Reports', href: '/reports' },
        ];
      case 'ORGANIZATION':
        return [
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Fleet', href: '/fleet' },
          { name: 'Drivers', href: '/drivers' },
          { name: 'Routes', href: '/routes' },
          { name: 'Earnings', href: '/earnings' },
          { name: 'Reports', href: '/reports' },
        ];
      default:
        return [];
    }
  }, [userType]);

  return navigationItems;
};