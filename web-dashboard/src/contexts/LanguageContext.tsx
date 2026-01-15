'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'en' | 'ne';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Translation dictionary
const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.routes': 'Routes',
    'nav.vehicles': 'Vehicles',
    'nav.schedules': 'Schedules',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.support': 'Support',
    'nav.logout': 'Logout',
    'nav.adminManagement': 'Admin Management',
    'nav.organizations': 'Organizations',
    'nav.drivers': 'Drivers',
    'nav.reports': 'Reports',

    // Dashboard
    'dashboard.overview': 'Dashboard Overview',
    'dashboard.totalBuses': 'Total Buses',
    'dashboard.activeBuses': 'Active Buses',
    'dashboard.todayRevenue': 'Today\'s Revenue',
    'dashboard.ongoingTrips': 'Ongoing Trips',
    'dashboard.liveMonitoring': 'Live System Monitoring',
    'dashboard.systemAlerts': 'System Alerts',
    'dashboard.recentIncidents': 'Recent Incidents',
    'dashboard.viewAllAlerts': 'View All System Alerts',
    'dashboard.filterRoutes': 'Filter Routes',
    'dashboard.refreshMap': 'Refresh Map',

    // Profile
    'profile.editProfile': 'Edit Profile',
    'profile.accountAuthority': 'Account Authority & Role',
    'profile.accountSettings': 'Account Settings',
    'profile.securityPassword': 'Security & Password',
    'profile.notificationPreferences': 'Notification Preferences',
    'profile.languageRegion': 'Language & Region',
    'profile.accessLogs': 'Access Logs',
    'profile.employeeId': 'Employee Identification',
    'profile.accountCreated': 'Account Created',
    'profile.lastLogin': 'Last Security Login',
    'profile.accountStatus': 'Account Status',
    'profile.phoneNumber': 'Phone Number',
    'profile.emailAddress': 'Email Address',
    'profile.location': 'Location',
    'profile.quickStats': 'Quick Stats',
    'profile.ticketsFixed': 'Tickets Fixed',
    'profile.routesManaged': 'Routes Managed',

    // Common
    'common.search': 'Search system records...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.update': 'Update',
    'common.manage': 'Manage',
    'common.change': 'Change',
    'common.viewLogs': 'View Logs',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.total': 'Total',
    'common.daily': 'Daily',
    'common.current': 'Current',
    'common.live': 'Live',

    // Roles
    'role.superAdmin': 'Super Admin',
    'role.admin': 'Admin',
    'role.organization': 'Organization',

    // Theme & Language
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'language.english': 'English',
    'language.nepali': 'नेपाली',
  },
  ne: {
    // Navigation
    'nav.dashboard': 'ड्यासबोर्ड',
    'nav.routes': 'मार्गहरू',
    'nav.vehicles': 'सवारी साधनहरू',
    'nav.schedules': 'तालिकाहरू',
    'nav.profile': 'प्रोफाइल',
    'nav.settings': 'सेटिङहरू',
    'nav.support': 'सहयोग',
    'nav.logout': 'लगआउट',
    'nav.adminManagement': 'प्रशासक व्यवस्थापन',
    'nav.organizations': 'संस्थाहरू',
    'nav.drivers': 'चालकहरू',
    'nav.reports': 'रिपोर्टहरू',

    // Dashboard
    'dashboard.overview': 'ड्यासबोर्ड अवलोकन',
    'dashboard.totalBuses': 'कुल बसहरू',
    'dashboard.activeBuses': 'सक्रिय बसहरू',
    'dashboard.todayRevenue': 'आजको आम्दानी',
    'dashboard.ongoingTrips': 'चलिरहेका यात्राहरू',
    'dashboard.liveMonitoring': 'प्रत्यक्ष प्रणाली निगरानी',
    'dashboard.systemAlerts': 'प्रणाली चेतावनीहरू',
    'dashboard.recentIncidents': 'हालका घटनाहरू',
    'dashboard.viewAllAlerts': 'सबै प्रणाली चेतावनीहरू हेर्नुहोस्',
    'dashboard.filterRoutes': 'मार्गहरू फिल्टर गर्नुहोस्',
    'dashboard.refreshMap': 'नक्सा रिफ्रेस गर्नुहोस्',

    // Profile
    'profile.editProfile': 'प्रोफाइल सम्पादन गर्नुहोस्',
    'profile.accountAuthority': 'खाता अधिकार र भूमिका',
    'profile.accountSettings': 'खाता सेटिङहरू',
    'profile.securityPassword': 'सुरक्षा र पासवर्ड',
    'profile.notificationPreferences': 'सूचना प्राथमिकताहरू',
    'profile.languageRegion': 'भाषा र क्षेत्र',
    'profile.accessLogs': 'पहुँच लगहरू',
    'profile.employeeId': 'कर्मचारी पहिचान',
    'profile.accountCreated': 'खाता सिर्जना गरिएको',
    'profile.lastLogin': 'अन्तिम सुरक्षा लगइन',
    'profile.accountStatus': 'खाता स्थिति',
    'profile.phoneNumber': 'फोन नम्बर',
    'profile.emailAddress': 'इमेल ठेगाना',
    'profile.location': 'स्थान',
    'profile.quickStats': 'द्रुत तथ्याङ्कहरू',
    'profile.ticketsFixed': 'समाधान गरिएका टिकटहरू',
    'profile.routesManaged': 'व्यवस्थापन गरिएका मार्गहरू',

    // Common
    'common.search': 'प्रणाली रेकर्डहरू खोज्नुहोस्...',
    'common.save': 'सेभ गर्नुहोस्',
    'common.cancel': 'रद्द गर्नुहोस्',
    'common.update': 'अपडेट गर्नुहोस्',
    'common.manage': 'व्यवस्थापन गर्नुहोस्',
    'common.change': 'परिवर्तन गर्नुहोस्',
    'common.viewLogs': 'लगहरू हेर्नुहोस्',
    'common.active': 'सक्रिय',
    'common.inactive': 'निष्क्रिय',
    'common.total': 'कुल',
    'common.daily': 'दैनिक',
    'common.current': 'हालको',
    'common.live': 'प्रत्यक्ष',

    // Roles
    'role.superAdmin': 'सुपर प्रशासक',
    'role.admin': 'प्रशासक',
    'role.organization': 'संस्था',

    // Theme & Language
    'theme.light': 'उज्यालो',
    'theme.dark': 'अँध्यारो',
    'language.english': 'English',
    'language.nepali': 'नेपाली',
  }
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Get language from localStorage
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ne')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // Save to localStorage
    localStorage.setItem('language', language);
  }, [language, mounted]);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};