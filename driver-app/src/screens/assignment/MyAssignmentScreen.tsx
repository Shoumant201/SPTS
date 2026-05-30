import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../../services/axiosInstance';

interface RouteStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  order: number;
}

interface Assignment {
  id: string;
  departureTime: string;
  days: string[];
  status: string;
  notes: string | null;
  runsToday: boolean;
  todayDay: string;
  vehicle: {
    id: string;
    plateNumber: string;
    type: string;
    capacity: number;
    iotDevice: { passengerCount: number; status: string } | null;
  };
  route: {
    id: string;
    name: string;
    routeNumber: string | null;
    startPoint: string;
    endPoint: string;
    distance: number;
    basePrice: number;
    stops: RouteStop[];
  };
  organization: {
    id: string;
    name: string;
    phone: string | null;
  };
}

const DAY_LABELS: Record<string, string> = {
  MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu',
  FRI: 'Fri', SAT: 'Sat', SUN: 'Sun',
};

const MyAssignmentScreen: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/assignments/my');
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error('Load assignments error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const todayAssignments = assignments.filter(a => a.runsToday);
  const otherAssignments = assignments.filter(a => !a.runsToday);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  const AssignmentCard = ({ assignment, highlight }: { assignment: Assignment; highlight: boolean }) => {
    const isExpanded = expandedId === assignment.id;
    const passengerCount = assignment.vehicle.iotDevice?.passengerCount ?? 0;
    const capacity = assignment.vehicle.capacity;
    const occupancy = capacity > 0 ? Math.round((passengerCount / capacity) * 100) : 0;

    return (
      <TouchableOpacity
        style={[styles.card, highlight && styles.cardHighlight]}
        onPress={() => setExpandedId(isExpanded ? null : assignment.id)}
        activeOpacity={0.8}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{assignment.departureTime}</Text>
            {highlight && (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>TODAY</Text>
              </View>
            )}
          </View>
          <View style={styles.statusDot} />
        </View>

        {/* Route info */}
        <View style={styles.routeRow}>
          <Text style={styles.routeName}>
            {assignment.route.routeNumber ? `#${assignment.route.routeNumber} ` : ''}
            {assignment.route.name}
          </Text>
          <Text style={styles.routeDistance}>{assignment.route.distance} km</Text>
        </View>

        <View style={styles.endpointsRow}>
          <View style={styles.endpoint}>
            <View style={[styles.dot, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.endpointText} numberOfLines={1}>{assignment.route.startPoint}</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
          <View style={styles.endpoint}>
            <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.endpointText} numberOfLines={1}>{assignment.route.endPoint}</Text>
          </View>
        </View>

        {/* Vehicle + Passengers */}
        <View style={styles.vehicleRow}>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleIcon}>🚌</Text>
            <Text style={styles.vehicleText}>{assignment.vehicle.plateNumber}</Text>
            <Text style={styles.vehicleType}>{assignment.vehicle.type}</Text>
          </View>
          {assignment.vehicle.iotDevice && (
            <View style={styles.passengerInfo}>
              <Text style={styles.passengerCount}>{passengerCount}/{capacity}</Text>
              <Text style={styles.passengerLabel}>pax</Text>
              <View style={styles.occupancyBar}>
                <View style={[styles.occupancyFill, {
                  width: `${Math.min(occupancy, 100)}%` as any,
                  backgroundColor: occupancy > 80 ? '#ef4444' : occupancy > 60 ? '#f97316' : '#22c55e',
                }]} />
              </View>
            </View>
          )}
        </View>

        {/* Days */}
        <View style={styles.daysRow}>
          {assignment.days.map(day => (
            <View key={day} style={[styles.dayChip, day === assignment.todayDay && styles.dayChipActive]}>
              <Text style={[styles.dayChipText, day === assignment.todayDay && styles.dayChipTextActive]}>
                {DAY_LABELS[day]}
              </Text>
            </View>
          ))}
        </View>

        {/* Expanded: stops list */}
        {isExpanded && (
          <View style={styles.stopsContainer}>
            <View style={styles.divider} />
            <Text style={styles.stopsTitle}>
              Route Stops ({assignment.route.stops.length})
            </Text>
            {assignment.route.stops.map((stop, index) => (
              <View key={stop.id} style={styles.stopRow}>
                <View style={styles.stopIndicator}>
                  <View style={[
                    styles.stopDot,
                    index === 0 && styles.stopDotFirst,
                    index === assignment.route.stops.length - 1 && styles.stopDotLast,
                  ]} />
                  {index < assignment.route.stops.length - 1 && <View style={styles.stopLine} />}
                </View>
                <View style={styles.stopInfo}>
                  <Text style={styles.stopName}>{stop.name}</Text>
                  <Text style={styles.stopCoords}>
                    {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                  </Text>
                </View>
              </View>
            ))}

            {assignment.notes && (
              <View style={styles.notesBox}>
                <Text style={styles.notesLabel}>Notes</Text>
                <Text style={styles.notesText}>{assignment.notes}</Text>
              </View>
            )}

            <View style={styles.orgRow}>
              <Text style={styles.orgLabel}>Organization</Text>
              <Text style={styles.orgName}>{assignment.organization.name}</Text>
              {assignment.organization.phone && (
                <Text style={styles.orgPhone}>{assignment.organization.phone}</Text>
              )}
            </View>

            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Base Fare</Text>
              <Text style={styles.fareValue}>NPR {assignment.route.basePrice}</Text>
            </View>
          </View>
        )}

        <Text style={styles.expandHint}>{isExpanded ? '▲ Less' : '▼ Details'}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Assignments</Text>
        <Text style={styles.subtitle}>
          {assignments.length === 0
            ? 'No active assignments'
            : `${assignments.length} active · ${todayAssignments.length} today`}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor="#FF6B35"
          />
        }
      >
        {assignments.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No assignments yet</Text>
            <Text style={styles.emptySubtitle}>
              Your organization hasn't assigned you to any routes yet.
            </Text>
          </View>
        ) : (
          <>
            {todayAssignments.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>TODAY</Text>
                {todayAssignments.map(a => (
                  <AssignmentCard key={a.id} assignment={a} highlight />
                ))}
              </>
            )}

            {otherAssignments.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>OTHER DAYS</Text>
                {otherAssignments.map(a => (
                  <AssignmentCard key={a.id} assignment={a} highlight={false} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1,
    marginBottom: 8, marginTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHighlight: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  timeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeText: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  todayBadge: { backgroundColor: '#FF6B35', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  todayBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e' },
  routeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  routeName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  routeDistance: { fontSize: 13, color: '#666', marginLeft: 8 },
  endpointsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  endpoint: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  endpointText: { fontSize: 12, color: '#555', flex: 1 },
  arrow: { fontSize: 14, color: '#999', marginHorizontal: 4 },
  vehicleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  vehicleInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vehicleIcon: { fontSize: 16 },
  vehicleText: { fontSize: 14, fontWeight: '600', color: '#333' },
  vehicleType: { fontSize: 12, color: '#888', backgroundColor: '#f0f0f0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  passengerInfo: { alignItems: 'flex-end' },
  passengerCount: { fontSize: 14, fontWeight: '600', color: '#333' },
  passengerLabel: { fontSize: 10, color: '#888' },
  occupancyBar: { width: 60, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, marginTop: 2, overflow: 'hidden' },
  occupancyFill: { height: '100%', borderRadius: 2 },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  dayChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#f0f0f0' },
  dayChipActive: { backgroundColor: '#FF6B35' },
  dayChipText: { fontSize: 11, color: '#666', fontWeight: '500' },
  dayChipTextActive: { color: '#fff' },
  expandHint: { fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 10 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },
  stopsTitle: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 10 },
  stopsContainer: {},
  stopRow: { flexDirection: 'row', marginBottom: 4 },
  stopIndicator: { width: 20, alignItems: 'center' },
  stopDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3b82f6', marginTop: 2 },
  stopDotFirst: { backgroundColor: '#22c55e' },
  stopDotLast: { backgroundColor: '#ef4444' },
  stopLine: { width: 2, flex: 1, backgroundColor: '#e5e7eb', marginTop: 2 },
  stopInfo: { flex: 1, paddingLeft: 8, paddingBottom: 8 },
  stopName: { fontSize: 13, fontWeight: '500', color: '#333' },
  stopCoords: { fontSize: 10, color: '#aaa', marginTop: 1 },
  notesBox: { backgroundColor: '#fef9c3', borderRadius: 8, padding: 10, marginTop: 8 },
  notesLabel: { fontSize: 11, fontWeight: '600', color: '#854d0e', marginBottom: 2 },
  notesText: { fontSize: 13, color: '#713f12' },
  orgRow: { marginTop: 10 },
  orgLabel: { fontSize: 11, color: '#888', marginBottom: 2 },
  orgName: { fontSize: 13, fontWeight: '600', color: '#333' },
  orgPhone: { fontSize: 12, color: '#666' },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  fareLabel: { fontSize: 12, color: '#888' },
  fareValue: { fontSize: 13, fontWeight: '600', color: '#333' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20, paddingHorizontal: 32 },
});

export default MyAssignmentScreen;
