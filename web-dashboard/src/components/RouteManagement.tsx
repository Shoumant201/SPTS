'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { routesApi, Route, RouteStop, CreateRouteData } from '../services/api/routes';

interface RouteMapEditorProps {
  stops: RouteStop[];
  onStopsChange: (stops: RouteStop[]) => void;
}

// Dynamically import the map to avoid SSR issues with Leaflet
const RouteMapEditor = dynamic<RouteMapEditorProps>(
  () => import('./RouteMapEditor'),
  { ssr: false, loading: () => (
  <div className="h-96 bg-gray-100 dark:bg-dark-700 rounded-lg flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
)});

interface RouteFormProps {
  initial?: Route;
  onSave: (data: CreateRouteData) => Promise<void>;
  onCancel: () => void;
}

const RouteForm: React.FC<RouteFormProps> = ({ initial, onSave, onCancel }) => {
  const [name, setName] = useState(initial?.name || '');
  const [routeNumber, setRouteNumber] = useState(initial?.routeNumber || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [basePrice, setBasePrice] = useState(initial?.basePrice?.toString() || '0');
  const [stops, setStops] = useState<RouteStop[]>(initial?.stops || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stops.length < 2) { setError('Add at least 2 stops on the map'); return; }
    setError('');
    setLoading(true);
    try {
      await onSave({ name, routeNumber: routeNumber || undefined, description: description || undefined, basePrice: parseFloat(basePrice), stops });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save route');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form fields */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Route Details</h3>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Route Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Ratnapark - Kalanki"
              className="w-full border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Route Number</label>
            <input value={routeNumber} onChange={e => setRouteNumber(e.target.value)} placeholder="e.g. 23, B-7"
              className="w-full border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base Fare (NPR) *</label>
          <input type="number" min="0" step="0.5" value={basePrice} onChange={e => setBasePrice(e.target.value)} required
            className="w-full border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Optional notes about this route"
            className="w-full border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        {/* Stops list */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Stops ({stops.length}) — click map to add
            </label>
            {stops.length > 0 && (
              <button type="button" onClick={() => setStops([])} className="text-xs text-red-500 hover:text-red-700">
                Clear all
              </button>
            )}
          </div>
          {stops.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No stops added yet. Click on the map to place stops.</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {stops.map((stop, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 dark:bg-dark-700 rounded px-3 py-1.5">
                  <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">{stop.order}</span>
                  <input
                    value={stop.name}
                    onChange={e => setStops(s => s.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                    className="flex-1 text-sm bg-transparent border-0 focus:outline-none text-gray-800 dark:text-gray-200"
                    placeholder="Stop name"
                  />
                  <span className="text-xs text-gray-400">{stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}</span>
                  <button type="button" onClick={() => setStops(s => s.filter((_, j) => j !== i).map((x, j) => ({ ...x, order: j + 1 })))}
                    className="text-red-400 hover:text-red-600 text-xs">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-dark-700 transition">
            Cancel
          </button>
          <button type="submit" onClick={handleSubmit} disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
            {loading ? 'Saving...' : (initial ? 'Update Route' : 'Create Route')}
          </button>
        </div>
      </div>

      {/* Map */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          Map — click to place stops
        </h3>
        <RouteMapEditor stops={stops} onStopsChange={setStops} />
      </div>
    </div>
  );
};

export const RouteManagement: React.FC<{ userType?: string }> = ({ userType }) => {
  const isAdmin = userType === 'SUPER_ADMIN' || userType === 'ADMIN';
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await routesApi.getRoutes();
      setRoutes(data);
    } catch (err) {
      console.error('Failed to load routes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (data: CreateRouteData) => {
    await routesApi.createRoute(data);
    setView('list');
    load();
  };

  const handleUpdate = async (data: CreateRouteData) => {
    if (!editingRoute) return;
    await routesApi.updateRoute(editingRoute.id, data);
    setView('list');
    setEditingRoute(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this route?')) return;
    setDeletingId(id);
    try {
      await routesApi.deleteRoute(id);
      setRoutes(r => r.filter(x => x.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (route: Route) => {
    await routesApi.updateRoute(route.id, { isActive: !route.isActive });
    setRoutes(r => r.map(x => x.id === route.id ? { ...x, isActive: !x.isActive } : x));
  };

  const filtered = routes.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.routeNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    r.startPoint.toLowerCase().includes(search.toLowerCase())
  );

  if (view === 'create') {
    if (!isAdmin) { setView('list'); return null; }
    return (
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setView('list')} className="text-gray-400 hover:text-gray-600">←</button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Route</h2>
        </div>
        <RouteForm onSave={handleCreate} onCancel={() => setView('list')} />
      </div>
    );
  }

  if (view === 'edit' && editingRoute) {
    if (!isAdmin) { setView('list'); return null; }
    return (
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { setView('list'); setEditingRoute(null); }} className="text-gray-400 hover:text-gray-600">←</button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Route: {editingRoute.name}</h2>
        </div>
        <RouteForm initial={editingRoute} onSave={handleUpdate} onCancel={() => { setView('list'); setEditingRoute(null); }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Routes', value: routes.length, color: 'text-gray-900 dark:text-white' },
          { label: 'Active', value: routes.filter(r => r.isActive).length, color: 'text-green-600' },
          { label: 'Inactive', value: routes.filter(r => !r.isActive).length, color: 'text-gray-500' },
          { label: 'Total Stops', value: routes.reduce((sum, r) => sum + r.stops.length, 0), color: 'text-blue-600' },
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">Routes</h2>
          <div className="flex gap-2">
            <input type="text" placeholder="Search routes..." value={search} onChange={e => setSearch(e.target.value)}
              className="border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
            {isAdmin && (
              <button onClick={() => setView('create')}
                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                + New Route
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🛣️</p>
            <p className="font-medium text-gray-600 dark:text-gray-300">No routes yet</p>
            <p className="text-sm mt-1">Create your first route to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-dark-700">
            {filtered.map(route => (
              <div key={route.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-dark-700 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {route.routeNumber && (
                        <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs font-bold px-2 py-0.5 rounded">
                          #{route.routeNumber}
                        </span>
                      )}
                      <span className="font-semibold text-gray-900 dark:text-white">{route.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${route.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {route.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>📍 {route.startPoint} → {route.endPoint}</span>
                      <span>🚏 {route.stops.length} stops</span>
                      <span>📏 {route.distance} km</span>
                      <span>💰 NPR {route.basePrice}</span>
                      {route._count && <span>🚌 {route._count.trips} trips</span>}
                    </div>
                    {route.stops.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {route.stops.map((stop, i) => (
                          <span key={i} className="text-xs bg-gray-100 dark:bg-dark-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                            {stop.order}. {stop.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {isAdmin && (
                      <>
                        <button onClick={() => handleToggleActive(route)}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-200 dark:border-dark-600 px-2 py-1 rounded">
                          {route.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => { setEditingRoute(route); setView('edit'); }}
                          className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 px-2 py-1 rounded">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(route.id)} disabled={deletingId === route.id}
                          className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded disabled:opacity-50">
                          {deletingId === route.id ? '...' : 'Delete'}
                        </button>
                      </>
                    )}
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
