'use client';

import React, { useState, useEffect } from 'react';
import { driverManagementApi, Driver, JoinRequest } from '../services/api/driverManagement';
import { useLanguage } from '../contexts/LanguageContext';

export const DriverManagement: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'search' | 'drivers' | 'requests'>('drivers');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Driver[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  useEffect(() => {
    if (activeTab === 'drivers') loadDrivers();
    else if (activeTab === 'requests') loadRequests();
  }, [activeTab]);

  // Auto-refresh requests only when tab is visible and user is on requests tab
  // Uses Page Visibility API to avoid polling when browser tab is hidden
  useEffect(() => {
    if (activeTab !== 'requests') return;

    const INTERVAL = 60000; // 60s — reduced from 15s
    let timer: NodeJS.Timeout;

    const schedule = () => {
      timer = setTimeout(async () => {
        if (document.visibilityState === 'visible') {
          await loadRequests(true);
        }
        schedule(); // reschedule after completion
      }, INTERVAL);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh immediately when user returns to tab
        loadRequests(true);
      }
    };

    schedule();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [activeTab]);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const response = await driverManagementApi.getOrganizationDrivers();
      setDrivers(response.drivers || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await driverManagementApi.getOrganizationRequests();
      setRequests(response.requests || []);
      setLastRefreshed(new Date());
    } catch (err: any) {
      if (!silent) setError(err.response?.data?.error || 'Failed to load requests');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) { setError('Please enter a search query'); return; }
    try {
      setLoading(true); setError('');
      const response = await driverManagementApi.searchDrivers(searchQuery);
      setSearchResults(response.drivers || []);
      if (response.drivers.length === 0) setError('No drivers found matching your search');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (driverId: string) => {
    try {
      setLoading(true); setError(''); setSuccess('');
      await driverManagementApi.sendJoinRequest(driverId, 'We would like to invite you to join our organization');
      setSuccess('Join request sent successfully');
      handleSearch();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;
    try {
      setLoading(true); setError(''); setSuccess('');
      await driverManagementApi.cancelJoinRequest(requestId);
      setSuccess('Request cancelled successfully');
      loadRequests();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel request');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDriver = async (driverId: string) => {
    if (!confirm('Are you sure you want to remove this driver from your organization?')) return;
    try {
      setLoading(true); setError(''); setSuccess('');
      await driverManagementApi.removeDriver(driverId);
      setSuccess('Driver removed successfully');
      loadDrivers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove driver');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'ACCEPTED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'EXPIRED': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const tabClass = (tab: string) =>
    `py-4 px-1 border-b-2 font-medium text-sm transition ${
      activeTab === tab
        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
    }`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page.driverManagement')}</h1>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-dark-700">
        <nav className="-mb-px flex space-x-8">
          <button onClick={() => setActiveTab('drivers')} className={tabClass('drivers')}>
            {t('nav.drivers')} ({drivers.length})
          </button>
          <button onClick={() => setActiveTab('search')} className={tabClass('search')}>
            {t('action.search')} {t('nav.drivers')}
          </button>
          <button onClick={() => setActiveTab('requests')} className={tabClass('requests')}>
            Join Requests ({requests.filter(r => r.status === 'PENDING').length})
          </button>
        </nav>
      </div>

      {/* My Drivers Tab */}
      {activeTab === 'drivers' && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            {t('nav.drivers')} in your organization
          </h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700">
              <p className="text-4xl mb-3">👤</p>
              <p className="text-gray-600 dark:text-gray-300 font-medium">No drivers yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Search and invite drivers to join your organization.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {drivers.map((driver) => (
                <div key={driver.id} className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{driver.name || 'Unnamed Driver'}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">📞 {driver.phone}</p>
                      {driver.email && <p className="text-gray-500 dark:text-gray-400 text-sm">✉️ {driver.email}</p>}
                      {driver.profile && (
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                          <div className="bg-gray-50 dark:bg-dark-700 rounded-lg px-3 py-2">
                            <p className="text-xs text-gray-400 dark:text-gray-500">License</p>
                            <p className="font-medium text-gray-700 dark:text-gray-200">{driver.profile.licenseNumber}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-dark-700 rounded-lg px-3 py-2">
                            <p className="text-xs text-gray-400 dark:text-gray-500">Experience</p>
                            <p className="font-medium text-gray-700 dark:text-gray-200">{driver.profile.experience || 0} yrs</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-dark-700 rounded-lg px-3 py-2">
                            <p className="text-xs text-gray-400 dark:text-gray-500">Rating</p>
                            <p className="font-medium text-gray-700 dark:text-gray-200">{driver.profile.rating?.toFixed(1) || 'N/A'} ⭐</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-dark-700 rounded-lg px-3 py-2">
                            <p className="text-xs text-gray-400 dark:text-gray-500">Status</p>
                            <p className={`font-medium text-sm ${driver.profile.isAvailable ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                              {driver.profile.isAvailable ? '● Available' : '● Busy'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveDriver(driver.id)}
                      className="ml-4 px-3 py-1.5 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Drivers Tab */}
      {activeTab === 'search' && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Search for Available Drivers</h2>
          <div className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by phone, license number, or name..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? 'Searching...' : t('action.search')}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Search for available drivers by phone number, license number, or name
            </p>
          </div>

          {searchResults.length > 0 && (
            <div className="grid gap-4">
              {searchResults.map((driver) => (
                <div key={driver.id} className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{driver.name || 'Unnamed Driver'}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${driver.isPhoneVerified ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'}`}>
                          {driver.isPhoneVerified ? '✓ Verified' : '⚠ Unverified'}
                        </span>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">📞 {driver.phone}</p>
                      {driver.profile && (
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                          <span>🪪 {driver.profile.licenseNumber}</span>
                          <span>⏱ {driver.profile.experience || 0} yrs</span>
                          <span>⭐ {driver.profile.rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {driver.hasExistingRequest ? (
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusColor(driver.existingRequestStatus || '')}`}>
                          {driver.existingRequestStatus}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(driver.id)}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                          disabled={loading}
                        >
                          {t('action.invite')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Join Requests Tab */}
      {activeTab === 'requests' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Join Requests</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Live · Last: {lastRefreshed.toLocaleTimeString()}
              </span>
              <button
                onClick={() => loadRequests()}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-1 rounded transition"
              >
                {t('action.refresh')}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700">
              <p className="text-4xl mb-3">📨</p>
              <p className="text-gray-600 dark:text-gray-300 font-medium">No join requests yet</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {requests.map((request) => (
                <div key={request.id} className={`bg-white dark:bg-dark-800 rounded-xl p-5 shadow-sm border ${
                  request.status === 'ACCEPTED' ? 'border-green-200 dark:border-green-800' :
                  request.status === 'REJECTED' ? 'border-red-100 dark:border-red-900' :
                  request.status === 'PENDING' ? 'border-orange-200 dark:border-orange-800' :
                  'border-gray-100 dark:border-dark-700'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {request.driver?.name || 'Unnamed Driver'}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                          {request.status === 'ACCEPTED' ? '✓ Accepted' :
                           request.status === 'REJECTED' ? '✗ Declined' :
                           request.status === 'PENDING' ? '⏳ Pending' :
                           request.status}
                        </span>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">📞 {request.driver?.phone}</p>
                      {request.driver?.profile && (
                        <div className="mt-1 flex gap-3 text-sm text-gray-400 dark:text-gray-500">
                          <span>🪪 {request.driver.profile.licenseNumber}</span>
                          {request.driver.profile.experience && (
                            <span>⏱ {request.driver.profile.experience} yrs</span>
                          )}
                        </div>
                      )}
                      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                        Sent: {new Date(request.requestedAt).toLocaleDateString()}
                        {request.respondedAt && ` · Responded: ${new Date(request.respondedAt).toLocaleDateString()}`}
                      </p>
                      {request.responseNote && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 italic">
                          Driver note: "{request.responseNote}"
                        </p>
                      )}
                    </div>
                    {request.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        className="ml-4 px-3 py-1.5 text-sm bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 border border-gray-200 dark:border-dark-600 transition"
                        disabled={loading}
                      >
                        {t('action.cancel')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
