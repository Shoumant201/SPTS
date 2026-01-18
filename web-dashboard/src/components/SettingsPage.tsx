'use client';

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Appearance Settings */}
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Appearance</h3>
        
        {/* Theme Toggle */}
        <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-700 rounded-lg transition">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Theme</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Switch between light and dark mode
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {theme === 'light' ? t('theme.light') : t('theme.dark')}
            </span>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Language Settings */}
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Language & Region</h3>
        
        {/* Language Selection */}
        <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-700 rounded-lg transition">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Display Language</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose your preferred language
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage('en')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                language === 'en'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
              }`}
            >
              {t('language.english')}
            </button>
            <button
              onClick={() => setLanguage('ne')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                language === 'ne'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
              }`}
            >
              {t('language.nepali')}
            </button>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">System Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Version</p>
            <p className="font-medium text-gray-900 dark:text-white">SPTS v2.1.0</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Last Updated</p>
            <p className="font-medium text-gray-900 dark:text-white">January 31, 2026</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Environment</p>
            <p className="font-medium text-gray-900 dark:text-white">Production</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Server Status</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <p className="font-medium text-green-600 dark:text-green-400">Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Advanced Settings</h3>
        
        <div className="space-y-4">
          {/* Data Export */}
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-700 rounded-lg transition">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Export Data</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Download your system data</p>
              </div>
            </div>
            <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm">
              Export
            </button>
          </div>

          {/* System Logs */}
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-700 rounded-lg transition">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">System Logs</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">View system activity logs</p>
              </div>
            </div>
            <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm">
              View Logs
            </button>
          </div>

          {/* Reset Settings */}
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-700 rounded-lg transition">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Reset Settings</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Reset all settings to default</p>
              </div>
            </div>
            <button className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium text-sm">
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};