'use client';

import React from 'react';
import { User, UserType } from '../services/api/auth';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardContentProps {
  user: User;
}

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  iconBg: string;
  badge?: string;
  badgeColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  iconBg,
  badge,
  badgeColor = 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
}) => (
  <div className="bg-white dark:bg-dark-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-dark-700">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
        {icon}
      </div>
      {badge && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${badgeColor}`}>
          {badge}
        </span>
      )}
    </div>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
    <div className="flex items-baseline gap-2">
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {change && (
        <span className={`text-sm font-medium ${
          changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 
          changeType === 'negative' ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
        }`}>
          {change}
        </span>
      )}
    </div>
  </div>
);

interface AlertItem {
  id: string;
  type: 'accident' | 'breakdown' | 'delay';
  title: string;
  description: string;
  time: string;
}

const AlertBadge: React.FC<{ type: AlertItem['type'] }> = ({ type }) => {
  const styles = {
    accident: 'bg-red-100 text-red-700',
    breakdown: 'bg-orange-100 text-orange-700',
    delay: 'bg-yellow-100 text-yellow-700',
  };
  const labels = {
    accident: 'ACCIDENT',
    breakdown: 'BREAKDOWN',
    delay: 'DELAY',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${styles[type]}`}>
      {labels[type]}
    </span>
  );
};

const SystemAlerts: React.FC = () => {
  const { t } = useLanguage();
  const alerts: AlertItem[] = [
    {
      id: '1',
      type: 'accident',
      title: 'Route 42 - Main St',
      description: 'Minor collision between Route 42 and private vehicle. Emergency services dispatched.',
      time: '2 mins ago',
    },
    {
      id: '2',
      type: 'breakdown',
      title: 'Route 10 - 5th Ave',
      description: 'Engine failure reported. Replacement bus B-204 is being deployed from South Depot.',
      time: '15 mins ago',
    },
    {
      id: '3',
      type: 'delay',
      title: 'Route 102 - North Station',
      description: 'Traffic congestion on bridge causing +15 mins delay for all inbound buses.',
      time: '25 mins ago',
    },
    {
      id: '4',
      type: 'delay',
      title: 'Route 7 - Industrial Park',
      description: 'Inclement weather causing slow transit speeds across Route 7 circuit.',
      time: '40 mins ago',
    },
  ];

  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 h-full">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">{t('dashboard.systemAlerts')}</h3>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-medium text-red-600 dark:text-red-400">3 CRITICAL</span>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{t('dashboard.recentIncidents')}</p>
        <div className="space-y-4 max-h-[480px] overflow-y-auto">
          {alerts.map((alert) => (
            <div key={alert.id} className="border-b border-gray-100 dark:border-dark-700 pb-4 last:border-0 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <AlertBadge type={alert.type} />
                <span className="text-xs text-gray-400 dark:text-gray-500">{alert.time}</span>
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">{alert.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{alert.description}</p>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition">
                  VIEW DETAILS
                </button>
                <button className="px-3 py-1.5 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition">
                  REROUTE
                </button>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
          {t('dashboard.viewAllAlerts')}
        </button>
      </div>
    </div>
  );
};

const LiveMap: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('dashboard.liveMonitoring')}</h3>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition">
            {t('dashboard.filterRoutes')}
          </button>
          <button className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
            {t('dashboard.refreshMap')}
          </button>
        </div>
      </div>
      <div className="relative h-[400px] bg-gray-100 dark:bg-dark-700">
        {/* Map placeholder - in production, integrate with a real map library */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-2">Live Map View</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Integrate with Google Maps or Mapbox for real-time tracking</p>
          </div>
        </div>
        {/* Sample bus markers */}
        <div className="absolute top-1/4 left-1/3 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
          </svg>
        </div>
        <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
          </svg>
        </div>
        <div className="absolute bottom-1/3 right-1/3 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
          </svg>
        </div>
        {/* Hospital marker */}
        <div className="absolute top-1/3 left-1/2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white text-xs font-bold">H</span>
        </div>
      </div>
    </div>
  );
};


// Super Admin Dashboard
export const SuperAdminDashboardContent: React.FC<DashboardContentProps> = ({ user }) => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.totalBuses')}
          value="1,240"
          change="+0%"
          changeType="neutral"
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          }
          iconBg="bg-blue-50 dark:bg-blue-900"
          badge={t('common.total')}
          badgeColor="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
        />
        <StatCard
          title={t('dashboard.activeBuses')}
          value="982"
          change="+5%"
          changeType="positive"
          icon={
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          }
          iconBg="bg-green-50 dark:bg-green-900"
          badge={`● ${t('common.live')}`}
          badgeColor="bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
        />
        <StatCard
          title={t('dashboard.todayRevenue')}
          value="$45,230"
          change="-12%"
          changeType="negative"
          icon={
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-orange-50 dark:bg-orange-900"
          badge={t('common.daily')}
          badgeColor="bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400"
        />
        <StatCard
          title={t('dashboard.ongoingTrips')}
          value="156"
          change="+3%"
          changeType="positive"
          icon={
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          iconBg="bg-purple-50 dark:bg-purple-900"
          badge={t('common.current')}
          badgeColor="bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400"
        />
      </div>

      {/* Map and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LiveMap />
        </div>
        <div className="lg:col-span-1">
          <SystemAlerts />
        </div>
      </div>
    </div>
  );
};

// Admin Dashboard
export const AdminDashboardContent: React.FC<DashboardContentProps> = ({ user }) => {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Organizations"
          value="52"
          change="+3 this month"
          changeType="positive"
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          iconBg="bg-blue-50"
          badge="Total"
          badgeColor="bg-gray-100 text-gray-600"
        />
        <StatCard
          title="Active Routes"
          value="128"
          change="+8%"
          changeType="positive"
          icon={
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          }
          iconBg="bg-green-50"
          badge="● Active"
          badgeColor="bg-green-100 text-green-600"
        />
        <StatCard
          title="Total Drivers"
          value="1,842"
          change="98% active"
          changeType="positive"
          icon={
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          iconBg="bg-orange-50"
          badge="Total"
          badgeColor="bg-gray-100 text-gray-600"
        />
        <StatCard
          title="Today's Trips"
          value="3,456"
          change="+12%"
          changeType="positive"
          icon={
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-purple-50"
          badge="Daily"
          badgeColor="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Map and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LiveMap />
        </div>
        <div className="lg:col-span-1">
          <SystemAlerts />
        </div>
      </div>
    </div>
  );
};

// Organization Dashboard
export const OrganizationDashboardContent: React.FC<DashboardContentProps> = ({ user }) => {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Buses"
          value="45"
          change="Fleet size"
          changeType="neutral"
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          }
          iconBg="bg-blue-50"
          badge="Total"
          badgeColor="bg-gray-100 text-gray-600"
        />
        <StatCard
          title="Active Buses"
          value="38"
          change="+2%"
          changeType="positive"
          icon={
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          }
          iconBg="bg-green-50"
          badge="● Live"
          badgeColor="bg-green-100 text-green-600"
        />
        <StatCard
          title="Today's Revenue"
          value="$8,450"
          change="+18%"
          changeType="positive"
          icon={
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-orange-50"
          badge="Daily"
          badgeColor="bg-orange-100 text-orange-600"
        />
        <StatCard
          title="Ongoing Trips"
          value="24"
          change="+5%"
          changeType="positive"
          icon={
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          iconBg="bg-purple-50"
          badge="Current"
          badgeColor="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Map and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LiveMap />
        </div>
        <div className="lg:col-span-1">
          <SystemAlerts />
        </div>
      </div>
    </div>
  );
};
