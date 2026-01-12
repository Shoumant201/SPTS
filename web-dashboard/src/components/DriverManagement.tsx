'use client';

import React, { useState, useEffect } from 'react';
import { driverManagementApi, Driver, JoinRequest } from '../services/api/driverManagement';

export const DriverManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'drivers' | 'requests'>('drivers');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Driver[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (activeTab === 'drivers') {
      loadDrivers();
    } else if (activeTab === 'requests') {
      loadRequests();
    }
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

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await driverManagementApi.getOrganizationRequests();
      setRequests(response.requests || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await driverManagementApi.searchDrivers(searchQuery);
      setSearchResults(response.drivers || []);
      if (response.drivers.length === 0) {
        setError('No drivers found matching your search');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (driverId: string) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await driverManagementApi.sendJoinRequest(driverId, 'We would like to invite you to join our organization');
      setSuccess('Join request sent successfully');
      // Refresh search results
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
      setLoading(true);
      setError('');
      setSuccess('');
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
      setLoading(true);
      setError('');
      setSuccess('');
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
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      case 'EXPIRED': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Driver Management</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('drivers')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'drivers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Drivers ({drivers.length})
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'search'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Search Drivers
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Join Requests ({requests.filter(r => r.status === 'PENDING').length})
          </button>
        </nav>
      </div>

      {/* My Drivers Tab */}
      {activeTab === 'drivers' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Organization Drivers</h2>
          {loading ? (
            <p>Loading...</p>
          ) : drivers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No drivers in your organization yet.</p>
              <p className="mt-2">Search and invite drivers to join your organization.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {drivers.map((driver) => (
                <div key={driver.id} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{driver.name || 'Unnamed Driver'}</h3>
                      <p className="text-gray-600">Phone: {driver.phone}</p>
                      {driver.email && <p className="text-gray-600">Email: {driver.email}</p>}
                      {driver.profile && (
                        <div className="mt-2 text-sm text-gray-600">
                          <p>License: {driver.profile.licenseNumber}</p>
                          <p>Experience: {driver.profile.experience || 0} years</p>
                          <p>Rating: {driver.profile.rating?.toFixed(1) || 'N/A'} ⭐</p>
                          <p>Total Trips: {driver.profile.totalTrips}</p>
                          <p className={driver.profile.isAvailable ? 'text-green-600' : 'text-red-600'}>
                            {driver.profile.isAvailable ? 'Available' : 'Not Available'}
                          </p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveDriver(driver.id)}
                      className="ml-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
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
          <h2 className="text-xl font-semibold mb-4">Search for Drivers</h2>
          <div className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by phone, license number, or name..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Search for available drivers by their phone number, license number, or name
            </p>
          </div>

          {searchResults.length > 0 && (
            <div className="grid gap-4">
              {searchResults.map((driver) => (
                <div key={driver.id} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{driver.name || 'Unnamed Driver'}</h3>
                      <p className="text-gray-600">Phone: {driver.phone}</p>
                      {driver.email && <p className="text-gray-600">Email: {driver.email}</p>}
                      <p className={`text-sm ${driver.isPhoneVerified ? 'text-green-600' : 'text-orange-600'}`}>
                        {driver.isPhoneVerified ? '✓ Verified' : '⚠ Not Verified'}
                      </p>
                      {driver.profile && (
                        <div className="mt-2 text-sm text-gray-600">
                          <p>License: {driver.profile.licenseNumber}</p>
                          <p>Experience: {driver.profile.experience || 0} years</p>
                          <p>Rating: {driver.profile.rating?.toFixed(1) || 'N/A'} ⭐</p>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      {driver.hasExistingRequest ? (
                        <span className={`px-4 py-2 rounded text-sm ${getStatusColor(driver.existingRequestStatus || '')}`}>
                          {driver.existingRequestStatus}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(driver.id)}
                          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                          disabled={loading}
                        >
                          Send Request
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
          <h2 className="text-xl font-semibold mb-4">Join Requests</h2>
          {loading ? (
            <p>Loading...</p>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No join requests yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {request.driver?.name || 'Unnamed Driver'}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-gray-600">Phone: {request.driver?.phone}</p>
                      {request.driver?.email && (
                        <p className="text-gray-600">Email: {request.driver.email}</p>
                      )}
                      {request.driver?.profile && (
                        <div className="mt-2 text-sm text-gray-600">
                          <p>License: {request.driver.profile.licenseNumber}</p>
                          <p>Experience: {request.driver.profile.experience || 0} years</p>
                        </div>
                      )}
                      <p className="mt-2 text-sm text-gray-500">
                        Requested: {new Date(request.requestedAt).toLocaleDateString()}
                      </p>
                      {request.responseNote && (
                        <p className="mt-2 text-sm text-gray-600">
                          Response: {request.responseNote}
                        </p>
                      )}
                    </div>
                    {request.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        className="ml-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        disabled={loading}
                      >
                        Cancel
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
