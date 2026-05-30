'use client';

import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useLanguage } from '../contexts/LanguageContext';

interface Summary {
  vehicles: { total: number; active: number; maintenance: number; inactive: number };
  drivers: { total: number };
  routes: { total: number; active: number };
  assignments: { total: number; active: number };
  requests: { pending: number };
  organizations: { total: number };
  iot: { online: number };
}

interface BarChartProps {
  data: { label: string; count: number; color?: string }[];
  title: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title }) => {
  const max = Math.max(...data.map(d => d.count), 1);
  const COLORS = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500', 'bg-red-500', 'bg-teal-500', 'bg-yellow-500'];

  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-dark-700">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, i) => (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
              <span className="font-semibold text-gray-900 dark:text-white">{item.count}</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-dark-600 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${item.color || COLORS[i % COLORS.length]}`}
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number | string; sub?: string; color: string; icon: string }> = ({ label, value, sub, color, icon }) => (
  <div className="bg-white dark:bg-dark-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-dark-700">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center text-xl`}>{icon}</div>
    </div>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

export const ReportsPage: React.FC = () => {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [fleet, setFleet] = useState<{ byType: any[]; byStatus: any[] } | null>(null);
  const [assignments, setAssignments] = useState<{ byStatus: any[]; byDay: any[]; recent: any[] } | null>(null);
  const [driverStats, setDriverStats] = useState<{ stats: any; drivers: any[] } | null>(null);
  const [routeStats, setRouteStats] = useState<{ stats: any; routes: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'fleet' | 'drivers' | 'routes' | 'assignments'>('overview');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [s, f, a, d, r] = await Promise.all([
          axiosInstance.get('/api/analytics/summary'),
          axiosInstance.get('/api/analytics/fleet'),
          axiosInstance.get('/api/analytics/assignments'),
          axiosInstance.get('/api/analytics/drivers'),
          axiosInstance.get('/api/analytics/routes'),
        ]);
        setSummary(s.data.summary);
        setFleet(f.data);
        setAssignments(a.data);
        setDriverStats(d.data);
        setRouteStats(r.data);
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const tabs = [
    { id: 'overview', label: t('reports.overview') },
    { id: 'fleet', label: t('reports.fleet') },
    { id: 'drivers', label: t('reports.drivers') },
    { id: 'routes', label: t('reports.routes') },
    { id: 'assignments', label: t('reports.assignments') },
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 dark:bg-dark-700 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-white dark:bg-dark-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Vehicles" value={summary.vehicles.total} sub={`${summary.vehicles.active} active`} color="bg-blue-50 dark:bg-blue-900/30" icon="🚌" />
            <StatCard label="Active Drivers" value={summary.drivers.total} color="bg-green-50 dark:bg-green-900/30" icon="👤" />
            <StatCard label="Active Routes" value={summary.routes.active} sub={`of ${summary.routes.total} total`} color="bg-purple-50 dark:bg-purple-900/30" icon="🛣️" />
            <StatCard label="Active Assignments" value={summary.assignments.active} sub={`${summary.assignments.total} total`} color="bg-orange-50 dark:bg-orange-900/30" icon="📅" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Vehicles in Maintenance" value={summary.vehicles.maintenance} color="bg-yellow-50 dark:bg-yellow-900/30" icon="🔧" />
            <StatCard label="IoT Devices Online" value={summary.iot.online} color="bg-teal-50 dark:bg-teal-900/30" icon="📡" />
            <StatCard label="Pending Invitations" value={summary.requests.pending} color="bg-red-50 dark:bg-red-900/30" icon="📨" />
            {summary.organizations.total > 0 && (
              <StatCard label="Organizations" value={summary.organizations.total} color="bg-indigo-50 dark:bg-indigo-900/30" icon="🏢" />
            )}
          </div>

          {/* Vehicle status breakdown */}
          {fleet && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <BarChart title="Vehicles by Type" data={fleet.byType.map(d => ({ label: d.label, count: d.count }))} />
              <BarChart title="Vehicles by Status" data={fleet.byStatus.map(d => ({
                label: d.label,
                count: d.count,
                color: d.label === 'ACTIVE' ? 'bg-green-500' : d.label === 'MAINTENANCE' ? 'bg-yellow-500' : 'bg-gray-400',
              }))} />
            </div>
          )}
        </div>
      )}

      {/* Fleet tab */}
      {activeTab === 'fleet' && fleet && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <BarChart title="Fleet by Vehicle Type" data={fleet.byType.map(d => ({ label: d.label, count: d.count }))} />
            <BarChart title="Fleet by Status" data={fleet.byStatus.map(d => ({
              label: d.label, count: d.count,
              color: d.label === 'ACTIVE' ? 'bg-green-500' : d.label === 'MAINTENANCE' ? 'bg-yellow-500' : 'bg-gray-400',
            }))} />
          </div>
          {summary && (
            <div className="bg-white dark:bg-dark-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-dark-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Fleet Health</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: 'Active', value: summary.vehicles.active, color: 'text-green-600' },
                  { label: 'Maintenance', value: summary.vehicles.maintenance, color: 'text-yellow-600' },
                  { label: 'Inactive', value: summary.vehicles.inactive, color: 'text-gray-500' },
                ].map(s => (
                  <div key={s.label} className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Drivers tab */}
      {activeTab === 'drivers' && driverStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Drivers" value={driverStats.stats.total} color="bg-blue-50 dark:bg-blue-900/30" icon="👤" />
            <StatCard label="In Organizations" value={driverStats.stats.withOrg} color="bg-green-50 dark:bg-green-900/30" icon="🏢" />
            <StatCard label="Unassigned" value={driverStats.stats.withoutOrg} color="bg-orange-50 dark:bg-orange-900/30" icon="🔍" />
            <StatCard label="With Profile" value={driverStats.stats.withProfile} color="bg-purple-50 dark:bg-purple-900/30" icon="📋" />
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-dark-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Driver List</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-dark-700">
                    {['Name', 'Phone', 'Organization', 'License', 'Experience', 'Trips', 'Status'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
                  {driverStats.drivers.map((d: any) => (
                    <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{d.name || '—'}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{d.phone}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{d.organization || <span className="text-orange-500 text-xs">Unassigned</span>}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{d.licenseType || '—'}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{d.experience ? `${d.experience} yrs` : '—'}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{d.totalTrips}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {d.isAvailable ? 'Available' : 'Busy'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Routes tab */}
      {activeTab === 'routes' && routeStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Routes" value={routeStats.stats.total} color="bg-blue-50 dark:bg-blue-900/30" icon="🛣️" />
            <StatCard label="Active Routes" value={routeStats.stats.active} color="bg-green-50 dark:bg-green-900/30" icon="✅" />
            <StatCard label="Total Distance" value={`${routeStats.stats.totalDistance} km`} color="bg-purple-50 dark:bg-purple-900/30" icon="📏" />
            <StatCard label="Avg Stops/Route" value={routeStats.stats.avgStops} color="bg-orange-50 dark:bg-orange-900/30" icon="🚏" />
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-dark-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Route Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-dark-700">
                    {['Route', 'Distance', 'Stops', 'Base Fare', 'Assignments', 'Status'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
                  {routeStats.routes.map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                      <td className="px-5 py-3">
                        <span className="font-medium text-gray-900 dark:text-white">{r.name}</span>
                        {r.routeNumber && <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">#{r.routeNumber}</span>}
                      </td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{r.distance} km</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{r.stopCount}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">NPR {r.basePrice}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{r.assignmentCount}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {r.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Assignments tab */}
      {activeTab === 'assignments' && assignments && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <BarChart title="Assignments by Status" data={assignments.byStatus.map(d => ({
              label: d.label, count: d.count,
              color: d.label === 'ACTIVE' ? 'bg-green-500' : d.label === 'SUSPENDED' ? 'bg-yellow-500' : 'bg-gray-400',
            }))} />
            <BarChart title="Active Assignments by Day" data={assignments.byDay.map(d => ({ label: d.day, count: d.count }))} />
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-dark-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Recent Assignments</h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-dark-700">
              {assignments.recent.length === 0 ? (
                <p className="text-center py-8 text-gray-400">No assignments yet</p>
              ) : assignments.recent.map((a: any) => (
                <div key={a.id} className="px-5 py-3 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white text-sm">{a.vehicle?.plateNumber}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-sm text-gray-600 dark:text-gray-300">{a.route?.name}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Driver: {a.driver?.name || a.driver?.phone} · {a.departureTime} · {a.days?.join(', ')}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    a.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    a.status === 'SUSPENDED' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                  }`}>{a.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
