'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { User } from '../services/api/auth';
import axiosInstance from '../services/axiosInstance';

const LiveFleetMap = dynamic(
  () => import('./LiveFleetMap').then((m) => m.LiveFleetMap),
  { ssr: false, loading: () => (
    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 h-80 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )}
);

// Visibility-aware polling hook — stops when browser tab is hidden
function useVisibilityPolling(callback: () => void, intervalMs: number) {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; }, [callback]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const schedule = () => {
      timer = setTimeout(() => {
        if (document.visibilityState === 'visible') {
          savedCallback.current();
        }
        schedule();
      }, intervalMs);
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') savedCallback.current();
    };

    schedule();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs]);
}

interface DashboardContentProps {
  user: User;
}

interface Summary {
  vehicles: { total: number; active: number; maintenance: number; inactive: number };
  drivers: { total: number };
  routes: { total: number; active: number };
  assignments: { total: number; active: number };
  requests: { pending: number };
  organizations: { total: number };
  iot: { online: number };
}

interface ActiveAssignment {
  id: string;
  departureTime: string;
  days: string[];
  vehicle: { plateNumber: string; type: string; capacity: number };
  driver: { name: string | null; phone: string };
  route: { name: string; routeNumber: string | null; startPoint: string; endPoint: string };
  iotPassengerCount?: number;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  badge?: string;
  badgeColor?: string;
  loading?: boolean;
}> = ({ title, value, sub, icon, iconBg, badge, badgeColor, loading }) => (
  <div className="bg-white dark:bg-dark-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-dark-700">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>{icon}</div>
      {badge && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${badgeColor || 'bg-blue-100 text-blue-600'}`}>{badge}</span>
      )}
    </div>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
    {loading ? (
      <div className="h-8 w-16 bg-gray-200 dark:bg-dark-600 rounded animate-pulse" />
    ) : (
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    )}
    {sub && !loading && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
  </div>
);

const LiveBadge: React.FC = () => (
  <div className="flex items-center gap-1.5">
    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
    <span className="text-xs font-medium text-green-600 dark:text-green-400">LIVE</span>
  </div>
);

// Shared dashboard sections
const ActiveAssignmentsList: React.FC<{ assignments: ActiveAssignment[]; loading: boolean }> = ({ assignments, loading }) => (
  <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700">
    <div className="px-5 py-4 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
      <h3 className="font-semibold text-gray-900 dark:text-white">Active Assignments Today</h3>
      <LiveBadge />
    </div>
    <div className="divide-y divide-gray-50 dark:divide-dark-700 max-h-80 overflow-y-auto">
      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-5 py-3 flex gap-3 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-dark-600 rounded w-24" />
            <div className="h-4 bg-gray-200 dark:bg-dark-600 rounded flex-1" />
          </div>
        ))
      ) : assignments.length === 0 ? (
        <div className="px-5 py-8 text-center text-gray-400 text-sm">No active assignments today</div>
      ) : (
        assignments.map(a => {
          const today = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()];
          const isToday = a.days.includes(today);
          return (
            <div key={a.id} className={`px-5 py-3 ${!isToday ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{a.departureTime}</p>
                    <p className="text-xs text-gray-400">{a.vehicle.plateNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {a.route.routeNumber ? `#${a.route.routeNumber} ` : ''}{a.route.name}
                    </p>
                    <p className="text-xs text-gray-400">{a.driver.name || a.driver.phone} · {a.vehicle.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  {a.iotPassengerCount !== undefined && (
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {a.iotPassengerCount}/{a.vehicle.capacity}
                      <span className="text-xs text-gray-400 ml-1">pax</span>
                    </p>
                  )}
                  {isToday && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Today</span>}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
);

const MapPlaceholder: React.FC = () => <LiveFleetMap />;

// SuperAdmin Dashboard
export const SuperAdminDashboardContent: React.FC<DashboardContentProps> = ({ user }) => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [assignments, setAssignments] = useState<ActiveAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([
        axiosInstance.get('/api/analytics/summary'),
        axiosInstance.get('/api/assignments'),
      ]);
      setSummary(s.data.summary);
      // Get active assignments with IoT data
      const activeAssignments = (a.data.assignments || []).filter((x: any) => x.status === 'ACTIVE');
      // Fetch IoT passenger counts
      const withIot = await Promise.all(
        activeAssignments.slice(0, 20).map(async (assignment: any) => {
          try {
            const v = await axiosInstance.get(`/api/fleet/${assignment.vehicleId}`);
            return { ...assignment, iotPassengerCount: v.data.vehicle?.iotDevice?.passengerCount };
          } catch {
            return assignment;
          }
        })
      );
      setAssignments(withIot);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useVisibilityPolling(load, 60000); // refresh every 60s when visible

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Vehicles"
          value={summary?.vehicles.total ?? '—'}
          sub={`${summary?.vehicles.active ?? 0} active`}
          icon={<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
          iconBg="bg-blue-50 dark:bg-blue-900/30"
          badge="Total"
          badgeColor="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
          loading={loading}
        />
        <StatCard
          title="Active Assignments"
          value={summary?.assignments.active ?? '—'}
          sub={`${summary?.assignments.total ?? 0} total`}
          icon={<svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" /></svg>}
          iconBg="bg-green-50 dark:bg-green-900/30"
          badge="● Live"
          badgeColor="bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
          loading={loading}
        />
        <StatCard
          title="Organizations"
          value={summary?.organizations.total ?? '—'}
          icon={<svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
          iconBg="bg-orange-50 dark:bg-orange-900/30"
          badge="Registered"
          badgeColor="bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400"
          loading={loading}
        />
        <StatCard
          title="Active Routes"
          value={summary?.routes.active ?? '—'}
          sub={`${summary?.routes.total ?? 0} total`}
          icon={<svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>}
          iconBg="bg-purple-50 dark:bg-purple-900/30"
          badge="Active"
          badgeColor="bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MapPlaceholder />
        </div>
        <div className="lg:col-span-1">
          <ActiveAssignmentsList assignments={assignments} loading={loading} />
        </div>
      </div>
    </div>
  );
};

// Admin Dashboard
export const AdminDashboardContent: React.FC<DashboardContentProps> = ({ user }) => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [assignments, setAssignments] = useState<ActiveAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([
        axiosInstance.get('/api/analytics/summary'),
        axiosInstance.get('/api/assignments'),
      ]);
      setSummary(s.data.summary);
      setAssignments((a.data.assignments || []).filter((x: any) => x.status === 'ACTIVE').slice(0, 20));
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useVisibilityPolling(load, 60000);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Organizations" value={summary?.organizations.total ?? '—'} sub="registered"
          icon={<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
          iconBg="bg-blue-50 dark:bg-blue-900/30" badge="Total" badgeColor="bg-gray-100 text-gray-600" loading={loading} />
        <StatCard title="Active Routes" value={summary?.routes.active ?? '—'} sub={`of ${summary?.routes.total ?? 0} total`}
          icon={<svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>}
          iconBg="bg-green-50 dark:bg-green-900/30" badge="● Active" badgeColor="bg-green-100 text-green-600" loading={loading} />
        <StatCard title="Total Drivers" value={summary?.drivers.total ?? '—'}
          icon={<svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          iconBg="bg-orange-50 dark:bg-orange-900/30" badge="Total" badgeColor="bg-gray-100 text-gray-600" loading={loading} />
        <StatCard title="Active Assignments" value={summary?.assignments.active ?? '—'}
          icon={<svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          iconBg="bg-purple-50 dark:bg-purple-900/30" badge="Live" badgeColor="bg-purple-100 text-purple-600" loading={loading} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><MapPlaceholder /></div>
        <div className="lg:col-span-1"><ActiveAssignmentsList assignments={assignments} loading={loading} /></div>
      </div>
    </div>
  );
};

// Organization Dashboard
export const OrganizationDashboardContent: React.FC<DashboardContentProps> = ({ user }) => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [assignments, setAssignments] = useState<ActiveAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([
        axiosInstance.get('/api/analytics/summary'),
        axiosInstance.get('/api/assignments'),
      ]);
      setSummary(s.data.summary);
      // Include IoT passenger counts for org's own vehicles
      const active = (a.data.assignments || []).filter((x: any) => x.status === 'ACTIVE');
      const withIot = await Promise.all(
        active.slice(0, 20).map(async (assignment: any) => {
          try {
            const v = await axiosInstance.get(`/api/fleet/${assignment.vehicleId}`);
            return { ...assignment, iotPassengerCount: v.data.vehicle?.iotDevice?.passengerCount };
          } catch {
            return assignment;
          }
        })
      );
      setAssignments(withIot);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useVisibilityPolling(load, 60000);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Buses" value={summary?.vehicles.total ?? '—'} sub="in your fleet"
          icon={<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
          iconBg="bg-blue-50 dark:bg-blue-900/30" badge="Total" badgeColor="bg-gray-100 text-gray-600" loading={loading} />
        <StatCard title="Active Buses" value={summary?.vehicles.active ?? '—'}
          icon={<svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" /></svg>}
          iconBg="bg-green-50 dark:bg-green-900/30" badge="● Live" badgeColor="bg-green-100 text-green-600" loading={loading} />
        <StatCard title="Active Assignments" value={summary?.assignments.active ?? '—'} sub={`${summary?.assignments.total ?? 0} total`}
          icon={<svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          iconBg="bg-orange-50 dark:bg-orange-900/30" badge="Today" badgeColor="bg-orange-100 text-orange-600" loading={loading} />
        <StatCard title="IoT Devices Online" value={summary?.iot.online ?? '—'}
          icon={<svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>}
          iconBg="bg-purple-50 dark:bg-purple-900/30" badge="Online" badgeColor="bg-purple-100 text-purple-600" loading={loading} />
      </div>

      {/* Maintenance alert */}
      {!loading && summary && summary.vehicles.maintenance > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-5 py-3 flex items-center gap-3">
          <span className="text-yellow-600 text-lg">⚠️</span>
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            <strong>{summary.vehicles.maintenance} vehicle{summary.vehicles.maintenance > 1 ? 's' : ''}</strong> currently in maintenance
          </p>
        </div>
      )}

      {/* Pending requests alert */}
      {!loading && summary && summary.requests.pending > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-5 py-3 flex items-center gap-3">
          <span className="text-blue-600 text-lg">📨</span>
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>{summary.requests.pending} driver invitation{summary.requests.pending > 1 ? 's' : ''}</strong> awaiting response — check Drivers → Join Requests
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><MapPlaceholder /></div>
        <div className="lg:col-span-1"><ActiveAssignmentsList assignments={assignments} loading={loading} /></div>
      </div>
    </div>
  );
};
