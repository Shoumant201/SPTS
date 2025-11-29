'use client';

import React, { useState } from 'react';
import { UserType } from '../services/api/auth';
import { useAuth } from '../contexts/AuthContext';

interface MultiTierLoginProps {
  onSuccess?: () => void;
}

export const MultiTierLogin: React.FC<MultiTierLoginProps> = ({ onSuccess }) => {
  const { login, isLoading } = useAuth();
  const [selectedUserType, setSelectedUserType] = useState<UserType>('ORGANIZATION');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const userTypeOptions = [
    { value: 'SUPER_ADMIN', label: 'Super Admin', description: 'Full system access' },
    { value: 'ADMIN', label: 'Admin', description: 'Organization management' },
    { value: 'ORGANIZATION', label: 'Organization', description: 'Fleet management' },
  ] as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await login(email, password, selectedUserType);
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Login failed. Please check your credentials.';
      setError(errorMessage);
    }
  };

  const getUserTypeColor = (userType: UserType) => {
    switch (userType) {
      case 'SUPER_ADMIN':
        return 'bg-blue-600 hover:bg-blue-700 border-blue-600';
      case 'ADMIN':
        return 'bg-green-600 hover:bg-green-700 border-green-600';
      case 'ORGANIZATION':
        return 'bg-purple-600 hover:bg-purple-700 border-purple-600';
      default:
        return 'bg-gray-600 hover:bg-gray-700 border-gray-600';
    }
  };

  const getSelectedColor = (userType: UserType) => {
    switch (userType) {
      case 'SUPER_ADMIN':
        return 'border-blue-500 bg-blue-50';
      case 'ADMIN':
        return 'border-green-500 bg-green-50';
      case 'ORGANIZATION':
        return 'border-purple-500 bg-purple-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
        SPTM Dashboard Login
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Account Type
          </label>
          <div className="space-y-2">
            {userTypeOptions.map((option) => (
              <div
                key={option.value}
                className={`border-2 rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                  selectedUserType === option.value
                    ? getSelectedColor(option.value)
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedUserType(option.value)}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    id={option.value}
                    name="userType"
                    value={option.value}
                    checked={selectedUserType === option.value}
                    onChange={(e) => setSelectedUserType(e.target.value as UserType)}
                    className="mr-3"
                  />
                  <div>
                    <label htmlFor={option.value} className="font-medium text-gray-800 cursor-pointer">
                      {option.label}
                    </label>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Email Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email"
            required
            disabled={isLoading}
          />
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your password"
            required
            disabled={isLoading}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full text-white py-3 px-4 rounded-lg font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${getUserTypeColor(selectedUserType)}`}
        >
          {isLoading ? 'Signing In...' : `Sign In as ${userTypeOptions.find(opt => opt.value === selectedUserType)?.label}`}
        </button>
      </form>

      {/* Help Text */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Select the appropriate account type and enter your credentials to access the dashboard.
        </p>
      </div>
    </div>
  );
};