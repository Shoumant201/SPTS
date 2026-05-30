'use client';

import React, { useState, useEffect } from 'react';
import { fleetApi, Vehicle, CreateVehicleData } from '../services/api/fleet';
import { useLanguage } from '../contexts/LanguageContext';

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  INACTIVE: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  MAINTENANCE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
};

const IOT_STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-500',
  OFFLINE: 'bg-red-100 text-red-600',
};

const VEHICLE_TYPE_ICONS = {
  BUS: '🚌',
  MINIBUS: '🚐',
  TAXI: '🚕',
};

interface AddVehicleModalProps {
  onClose: () => void;
  onSuccess: (vehicle: Vehicle, deviceToken: string) => void;
}

const AddVehicleModal: React.FC<AddVehicleModalProps> = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState<CreateVehicleData>({
    plateNumber: '',
    capacity: 40,
    type: 'BUS',
    model: '',
    year: new Date().getFullYear(),
    iotDeviceId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await fleetApi.createVehicle({
        ...form,
        model: form.model || undefined,
        year: form.year || undefined,
      });
      onSuccess(result.vehicle, result.vehicle.iotDevice?.deviceToken || '');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Register New Vehicle</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plate Number *</label>
              <input
                type="text"
                required
                value={form.plateNumber}
                onChange={e => setForm(f => ({ ...f, plateNumber: e.target.value.toUpperCase() }))}
                placeholder="BA 1 KHA 1234"
                className="w-full border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle Type *</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                className="w-full border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BUS">🚌 Bus</option>
                <option value="MINIBUS">🚐 Minibus</option>
                <option value="TAXI">🚕 Taxi</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Capacity (seats) *</label>
              <input
                type="number"
                required
                min={1}
                max={100}
                value={form.capacity}
                onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) }))}
                className="w-full border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
              <input
                type="number"
                min={1990}
                max={new Date().getFullYear() + 1}
                value={form.year || ''}
                onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) || undefined }))}
                className="w-full border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle Model</label>
            <input
              type="text"
              value={form.model || ''}
              onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
              placeholder="e.g. Tata LP 713, Ashok Leyland"
              className="w-full border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="border-t border-gray-100 dark:border-dark-700 pt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              IoT Device Serial Number *
            </label>
            <input
              type="text"
              required
              value={form.iotDeviceId}
              onChange={e => setForm(f => ({ ...f, iotDeviceId: e.target.value.trim() }))}
              placeholder="e.g. SPTM-IOT-2024-001234"
              className="w-full border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter the serial number printed on the IoT hardware unit installed in the vehicle.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-dark-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Registering...' : 'Register Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeviceTokenModalProps {
  vehicle: Vehicle;
  deviceToken: string;
  onClose: () => void;
}

const DeviceTokenModal: React.FC<DeviceTokenModalProps> = ({ vehicle, deviceToken, onClose }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(deviceToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-1">
            Vehicle Registered!
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            {vehicle.plateNumber} — {vehicle.type}
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-amber-800 mb-2">⚠️ Save this device token now</p>
            <p className="text-xs text-amber-700 mb-3">
              This token is shown only once. Configure it on the IoT hardware unit. Without it, the device cannot send data.
            </p>
            <div className="bg-white border border-amber-200 rounded px-3 py-2 font-mono text-xs text-gray-800 break-all">
              {deviceToken}
            </div>
            <button
              onClick={copy}
              className="mt-2 w-full px-3 py-1.5 bg-amber-600 text-white text-xs rounded hover:bg-amber-700 transition"
            >
              {copied ? '✓ Copied!' : 'Copy Token'}
            </button>
          </div>

          <div className="text-xs text-gray-500 space-y-1 mb-4">
            <p><strong>Device Serial:</strong> {vehicle.iotDevice?.deviceId}</p>
            <p><strong>IoT Endpoint:</strong> POST /api/iot/{vehicle.iotDevice?.deviceId}/data</p>
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export const FleetManagement: React.FC = () => {
  const { t } = useLanguage();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState<{ vehicle: Vehicle; token: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await fleetApi.getVehicles();
      setVehicles(data);
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAddSuccess = (vehicle: Vehicle, deviceToken: string) => {
    setShowAddModal(false);
    setNewVehicle({ vehicle, token: deviceToken });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vehicle? This will also remove the IoT device registration.')) return;
    setDeletingId(id);
    try {
      await fleetApi.deleteVehicle(id);
      setVehicles(v => v.filter(x => x.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fleetApi.updateVehicle(id, { status });
      setVehicles(v => v.map(x => x.id === id ? { ...x, status: status as any } : x));
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const filtered = vehicles.filter(v => {
    const matchSearch = v.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
      (v.model || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || v.status === statusFilter;
    const matchType = typeFilter === 'ALL' || v.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const stats = {
    total: vehicles.length,
    active: vehicles.filter(v => v.status === 'ACTIVE').length,
    inactive: vehicles.filter(v => v.status === 'INACTIVE').length,
    maintenance: vehicles.filter(v => v.status === 'MAINTENANCE').length,
    iotOnline: vehicles.filter(v => v.iotDevice?.status === 'ACTIVE').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total Vehicles', value: stats.total, color: 'text-gray-900 dark:text-white' },
          { label: 'Active', value: stats.active, color: 'text-green-600' },
          { label: 'Inactive', value: stats.inactive, color: 'text-gray-500' },
          { label: 'Maintenance', value: stats.maintenance, color: 'text-yellow-600' },
          { label: 'IoT Online', value: stats.iotOnline, color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-dark-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Header + Filters */}
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-700 flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">Fleet</h2>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Search plate or model..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="BUS">Bus</option>
              <option value="MINIBUS">Minibus</option>
              <option value="TAXI">Taxi</option>
            </select>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
            >
              + {t('fleet.addVehicle')}
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🚌</p>
            <p className="font-medium text-gray-600 dark:text-gray-300">{t('fleet.noVehicles')}</p>
            <p className="text-sm mt-1">{t('fleet.noVehiclesHint')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-700">
                  {['Vehicle', 'Type', 'Capacity', 'Status', 'IoT Device', 'Passengers', 'Actions'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
                {filtered.map(vehicle => (
                  <tr key={vehicle.id} className="hover:bg-gray-50 dark:hover:bg-dark-700 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white">{vehicle.plateNumber}</div>
                      {vehicle.model && <div className="text-xs text-gray-400">{vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-base">{VEHICLE_TYPE_ICONS[vehicle.type]}</span>
                      <span className="ml-1 text-gray-600 dark:text-gray-300">{vehicle.type}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{vehicle.capacity}</td>
                    <td className="px-6 py-4">
                      <select
                        value={vehicle.status}
                        onChange={e => handleStatusChange(vehicle.id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[vehicle.status]}`}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="MAINTENANCE">Maintenance</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      {vehicle.iotDevice ? (
                        <div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${IOT_STATUS_COLORS[vehicle.iotDevice.status]}`}>
                            {vehicle.iotDevice.status}
                          </span>
                          <div className="text-xs text-gray-400 mt-0.5">{vehicle.iotDevice.deviceId}</div>
                          {vehicle.iotDevice.lastSeenAt && (
                            <div className="text-xs text-gray-400">
                              Last seen: {new Date(vehicle.iotDevice.lastSeenAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No device</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {vehicle.iotDevice ? vehicle.iotDevice.passengerCount : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(vehicle.id)}
                        disabled={deletingId === vehicle.id}
                        className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                      >
                        {deletingId === vehicle.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddVehicleModal onClose={() => setShowAddModal(false)} onSuccess={handleAddSuccess} />
      )}

      {newVehicle && (
        <DeviceTokenModal
          vehicle={newVehicle.vehicle}
          deviceToken={newVehicle.token}
          onClose={() => setNewVehicle(null)}
        />
      )}
    </div>
  );
};
