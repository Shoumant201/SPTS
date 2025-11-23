// Core data models for the Driver Mobile Application

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
}

export interface Driver {
  id: string;
  name: string;
  employeeId: string;
  currentShift: Shift | null;
  currentTrip: Trip | null;
  location: Location;
  status: 'online' | 'offline' | 'on_break';
}

export interface Shift {
  id: string;
  driverId: string;
  startTime: Date;
  endTime?: Date;
  totalHours?: number;
  earnings?: number;
  trips: Trip[];
}

export interface Stop {
  id: string;
  name: string;
  location: Location;
  scheduledTime: Date;
  estimatedArrival?: Date;
  actualArrival?: Date;
  order: number;
}

export interface Trip {
  id: string;
  routeId: string;
  routeName: string;
  scheduledStartTime: Date;
  actualStartTime?: Date;
  endTime?: Date;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  occupancy: {
    current: number;
    capacity: number;
    autoDetection: boolean;
  };
  stops: Stop[];
}

export interface Incident {
  id: string;
  type: 'breakdown' | 'delay' | 'accident' | 'traffic';
  severity: 'low' | 'medium' | 'high';
  location: Location;
  timestamp: Date;
  description?: string;
  resolved: boolean;
  driverId: string;
  tripId?: string;
}

export interface Message {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  isUrgent: boolean;
  type: 'announcement' | 'alert' | 'update';
}

export interface Route {
  id: string;
  name: string;
  description?: string;
  stops: Stop[];
  estimatedDuration: number;
  isActive: boolean;
}

// UI Component Props Types
export interface DriverButtonProps {
  title: string;
  onPress: () => void;
  variant: 'primary' | 'secondary' | 'danger' | 'warning';
  size: 'large' | 'medium';
  disabled?: boolean;
  icon?: string;
  loading?: boolean;
}

export interface StatusCardProps {
  title: string;
  value: string | number;
  status: 'active' | 'inactive' | 'warning';
  subtitle?: string;
  onPress?: () => void;
}

export interface OccupancyCounterProps {
  currentCount: number;
  maxCapacity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  autoMode: boolean;
  onToggleMode: () => void;
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  RouteMap: undefined;
  IncidentReport: undefined;
  ShiftSummary: undefined;
  Messages: undefined;
};

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  driver: Driver;
  expiresIn: number;
}