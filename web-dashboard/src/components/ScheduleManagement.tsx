'use client';

import React, { useState, useEffect } from 'react';
import { assignmentsApi, Assignment, CreateAssignmentData, DAYS, Day } from '../services/api/assignments';
import { fleetApi, Vehicle } from '../services/api/fleet';
import { routesApi, Route } from '../services/api/routes';
import axiosInstance from '../services/axiosInstance';
import { useLanguage } from '../contexts/LanguageContext';

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-gray-100 text-gray-500',
};

const DAY_LABELS: Record<Day, string> = {
  MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun',
};

interface Driver {
  id: string;
  name: string | null;
  phone: string;
}

interface AssignmentFormProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  routes: Route[];
  onSave: (data: CreateAssignmentData) => Promise<void>;
  onCancel: () => void;
  initial?: Assignment;
}

const AssignmentForm: React.FC<AssignmentFormProps> = ({ vehicles, drivers, routes, onSave, onCancel, initial }) => {
  const [vehicleId, setVehicleId] = useState(initial?.vehicleId || '');
  const [driverId, setDriverId] = useState(initial?.driverId || '');
  const [routeId, setRouteId] = useState(initial?.routeId || '');
  const [departureTime, setDepartureTime] = useState(initial?.departureTime || '07:00');
  const [days, setDays] = useState<Day[]>(initial?.days || ['MON', 'TUE', 'WED', 'THU', 'FRI']);
  const [notes, setNotes] = useState(initial?.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleDay = (day: Day) => {
    setDays(d => d.includes(day) ? d.filter(x => x !== day) : [...d, day]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !driverId || !routeId) { setError('Please fill all required fields'); return; }
    if (days.length === 0) { setError('Select at least one day'); return; }
    setError('');
    setLoading(true);
    try {
      await onSave({ vehicleId, driverId, routeId, departureTime, days, notes: notes || undefined });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save assignment');
    } finally {
      setLoading(false);
    }
  };

  const selectedRoute = routes.find(r => r.id === routeId);
  const selectedVehicle = vehicles.find(v => v.id === vehicleId);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Vehicle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle *</label>
          <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} required
            className="w-full border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select vehicle...</option>
            {vehicles.filter(v => v.status === 'ACTIVE').map(v => (
              <option key={v.id} value={v.id}>{v.plateNumber} — {v.type} ({v.capacity} seats)</option>
            ))}
          </select>
        </div>

        {/* Driver */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Driver *</label>
          <select value={driverId} onChange={e => setDriverId(e.target.value)} required
            className="w-full border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select driver...</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.name || 'Unnamed'} — {d.phone}</option>
            ))}
          </select>
        </div>

        {/* Route */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Route *</label>
          <select value={routeId} onChange={e => setRouteId(e.target.value)} required
            className="w-full border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select route...</option>
            {routes.filter(r => r.isActive).map(r => (
              <option key={r.id} value={r.id}>
                {r.routeNumber ? `#${r.routeNumber} ` : ''}{r.name} ({r.distance} km)
              </option>
            ))}
          </select>
          {selectedRoute && (
            <p className="text-xs text-gray-400 mt-1">📍 {selectedRoute.startPoint} → {selectedRoute.endPoint}</p>
          )}
        </div>

        {/* Departure time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Departure Time *</label>
          <input type="time" value={departureTime} onChange={e => setDepartureTime(e.target.value)} required
            className="w-full border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Days */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Operating Days *</label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map(day => (
            <button key={day} type="button" onClick={() => toggleDay(day)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                days.includes(day)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
              }`}>
              {DAY_LABELS[day]}
            </button>
          ))}
          <button type="button" onClick={() => setDays(['MON','TUE','WED','THU','FRI'])}
            className="px-3 py-1.5 rounded-lg text-xs text-blue-600 border border-blue-200 hover:bg-blue-50 transition">
            Weekdays
          </button>
          <button type="button" onClick={() => setDays([...DAYS])}
            className="px-3 py-1.5 rounded-lg text-xs text-blue-600 border border-blue-200 hover:bg-blue-50 transition">
            Daily
          </button>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
        <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..."
          className="w-full border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Summary */}
      {vehicleId && driverId && routeId && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-300">
          <strong>Summary:</strong> {selectedVehicle?.plateNumber} with {drivers.find(d => d.id === driverId)?.name || 'driver'} on {selectedRoute?.name} at {departureTime} — {days.map(d => DAY_LABELS[d]).join(', ')}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-dark-700 transition">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
          {loading ? 'Saving...' : (initial ? 'Update Assignment' : 'Create Assignment')}
        </button>
      </div>
    </form>
  );
};

export const ScheduleManagement: React.FC = () => {
  const { t } = useLanguage();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [a, v, r] = await Promise.all([
        assignmentsApi.getAll(),
        fleetApi.getVehicles(),
        routesApi.getRoutes(),
      ]);
      setAssignments(a);
      setVehicles(v);
      setRoutes(r);

      // Load org drivers
      const driversRes = await axiosInstance.get('/api/driver-management/organization/drivers');
      setDrivers(driversRes.data.drivers?.map((d: any) => ({
        id: d.id,
        name: d.name,
        phone: d.phone,
      })) || []);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (data: CreateAssignmentData) => {
    await assignmentsApi.create(data);
    setShowForm(false);
    load();
  };

  const handleUpdate = async (data: CreateAssignmentData) => {
    if (!editingAssignment) return;
    await assignmentsApi.update(editingAssignment.id, data);
    setEditingAssignment(null);
    load();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await assignmentsApi.update(id, { status });
    setAssignments(a => a.map(x => x.id === id ? { ...x, status: status as any } : x));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment?')) return;
    setDeletingId(id);
    try {
      await assignmentsApi.delete(id);
      setAssignments(a => a.filter(x => x.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = assignments.filter(a => statusFilter === 'ALL' || a.status === statusFilter);

  const stats = {
    total: assignments.length,
    active: assignments.filter(a => a.status === 'ACTIVE').length,
    suspended: assignments.filter(a => a.status === 'SUSPENDED').length,
  };

  if (showForm || editingAssignment) {
    return (
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { setShowForm(false); setEditingAssignment(null); }} className="text-gray-400 hover:text-gray-600">←</button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editingAssignment ? 'Edit Assignment' : 'New Bus Assignment'}
          </h2>
        </div>
        <AssignmentForm
          vehicles={vehicles}
          drivers={drivers}
          routes={routes}
          initial={editingAssignment || undefined}
          onSave={editingAssignment ? handleUpdate : handleCreate}
          onCancel={() => { setShowForm(false); setEditingAssignment(null); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Assignments', value: stats.total, color: 'text-gray-900 dark:text-white' },
          { label: 'Active', value: stats.active, color: 'text-green-600' },
          { label: 'Suspended', value: stats.suspended, color: 'text-yellow-600' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-dark-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-700 flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">{t('page.scheduleManagement')}</h2>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none">
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <button onClick={() => setShowForm(true)}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
              + {t('schedule.newAssignment')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📅</p>
            <p className="font-medium text-gray-600 dark:text-gray-300">No assignments yet</p>
            <p className="text-sm mt-1">Assign a bus and driver to a route to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-dark-700">
            {filtered.map(a => (
              <div key={a.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-dark-700 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header row */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status]}`}>
                        {a.status}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">
                        🕐 {a.departureTime}
                      </span>
                      <div className="flex gap-1">
                        {a.days.map(d => (
                          <span key={d} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                            {DAY_LABELS[d]}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                        <span>🚌</span>
                        <span className="font-medium">{a.vehicle.plateNumber}</span>
                        <span className="text-gray-400 text-xs">({a.vehicle.type}, {a.vehicle.capacity} seats)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                        <span>👤</span>
                        <span>{a.driver.name || 'Unnamed'}</span>
                        <span className="text-gray-400 text-xs">{a.driver.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                        <span>🛣️</span>
                        <span>{a.route.routeNumber ? `#${a.route.routeNumber} ` : ''}{a.route.name}</span>
                        <span className="text-gray-400 text-xs">({a.route.distance} km)</span>
                      </div>
                    </div>

                    {a.notes && <p className="text-xs text-gray-400 mt-1.5 italic">{a.notes}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <select value={a.status} onChange={e => handleStatusChange(a.id, e.target.value)}
                      className="text-xs border border-gray-200 dark:border-dark-600 rounded px-2 py-1 bg-white dark:bg-dark-700 dark:text-white focus:outline-none">
                      <option value="ACTIVE">Active</option>
                      <option value="SUSPENDED">Suspend</option>
                      <option value="COMPLETED">Complete</option>
                    </select>
                    <button onClick={() => setEditingAssignment(a)}
                      className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 px-2 py-1 rounded">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(a.id)} disabled={deletingId === a.id}
                      className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded disabled:opacity-50">
                      {deletingId === a.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
