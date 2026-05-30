import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../../services/axiosInstance';

interface JoinRequest {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
  message: string | null;
  requestedAt: string;
  expiresAt: string | null;
  organization: {
    id: string;
    name: string;
    phone: string | null;
    email: string;
    address: string | null;
  };
}

const STATUS_CONFIG = {
  PENDING: { color: '#FF9800', bg: '#FFF3E0', label: 'Pending' },
  ACCEPTED: { color: '#4CAF50', bg: '#E8F5E9', label: 'Accepted' },
  REJECTED: { color: '#F44336', bg: '#FFEBEE', label: 'Rejected' },
  CANCELLED: { color: '#9E9E9E', bg: '#F5F5F5', label: 'Cancelled' },
  EXPIRED: { color: '#9E9E9E', bg: '#F5F5F5', label: 'Expired' },
};

const JoinRequestsScreen: React.FC = () => {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/driver-management/driver/requests');
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error('Load requests error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
    // Poll every 3 minutes on mobile — user can pull-to-refresh for immediate update
    const interval = setInterval(loadRequests, 180000);
    return () => clearInterval(interval);
  }, [loadRequests]);

  const handleAccept = async (requestId: string, orgName: string) => {
    Alert.alert(
      'Accept Invitation',
      `Join ${orgName}? You will become part of their organization and other pending requests will be cancelled.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setRespondingId(requestId);
            try {
              await axiosInstance.post(`/api/driver-management/driver/requests/${requestId}/respond`, {
                action: 'accept',
              });
              Alert.alert('Joined!', `You are now part of ${orgName}`);
              loadRequests();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to accept request');
            } finally {
              setRespondingId(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (requestId: string) => {
    setRespondingId(requestId);
    try {
      await axiosInstance.post(`/api/driver-management/driver/requests/${requestId}/respond`, {
        action: 'reject',
        responseNote: rejectNote || undefined,
      });
      setShowRejectInput(null);
      setRejectNote('');
      loadRequests();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to reject request');
    } finally {
      setRespondingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return diff > 0 && diff < 24 * 60 * 60 * 1000; // less than 24h
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  const renderRequest = ({ item }: { item: JoinRequest }) => {
    const config = STATUS_CONFIG[item.status];
    const isPending = item.status === 'PENDING';
    const isResponding = respondingId === item.id;
    const showingReject = showRejectInput === item.id;

    return (
      <View style={styles.card}>
        {/* Org header */}
        <View style={styles.cardHeader}>
          <View style={styles.orgAvatar}>
            <Text style={styles.orgAvatarText}>{item.organization.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.orgInfo}>
            <Text style={styles.orgName}>{item.organization.name}</Text>
            {item.organization.phone && (
              <Text style={styles.orgPhone}>{item.organization.phone}</Text>
            )}
            {item.organization.address && (
              <Text style={styles.orgAddress} numberOfLines={1}>{item.organization.address}</Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>

        {/* Message */}
        {item.message && (
          <View style={styles.messageBox}>
            <Text style={styles.messageLabel}>Message from organization:</Text>
            <Text style={styles.messageText}>"{item.message}"</Text>
          </View>
        )}

        {/* Dates */}
        <View style={styles.dateRow}>
          <Text style={styles.dateText}>Received: {formatDate(item.requestedAt)}</Text>
          {item.expiresAt && isPending && (
            <Text style={[styles.dateText, isExpiringSoon(item.expiresAt) && styles.expiringSoon]}>
              {isExpiringSoon(item.expiresAt) ? '⚠️ ' : ''}Expires: {formatDate(item.expiresAt)}
            </Text>
          )}
        </View>

        {/* Actions for pending */}
        {isPending && (
          <View style={styles.actions}>
            {showingReject ? (
              <View style={styles.rejectInputContainer}>
                <TextInput
                  style={styles.rejectInput}
                  placeholder="Reason for rejecting (optional)"
                  value={rejectNote}
                  onChangeText={setRejectNote}
                  multiline
                />
                <View style={styles.rejectButtons}>
                  <TouchableOpacity
                    style={styles.cancelRejectBtn}
                    onPress={() => { setShowRejectInput(null); setRejectNote(''); }}
                  >
                    <Text style={styles.cancelRejectText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmRejectBtn, isResponding && styles.disabledBtn]}
                    onPress={() => handleReject(item.id)}
                    disabled={isResponding}
                  >
                    {isResponding ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.confirmRejectText}>Confirm Reject</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.rejectBtn, isResponding && styles.disabledBtn]}
                  onPress={() => setShowRejectInput(item.id)}
                  disabled={isResponding}
                >
                  <Text style={styles.rejectBtnText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.acceptBtn, isResponding && styles.disabledBtn]}
                  onPress={() => handleAccept(item.id, item.organization.name)}
                  disabled={isResponding}
                >
                  {isResponding ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.acceptBtnText}>Accept & Join</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Organization Invites</Text>
        {pendingCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingCount}</Text>
          </View>
        )}
      </View>

      {requests.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No invitations yet</Text>
          <Text style={styles.emptySubtitle}>
            When an organization invites you to join, it will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          renderItem={renderRequest}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRequests(); }} tintColor="#FF6B35" />
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', flex: 1 },
  badge: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  orgAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orgAvatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  orgInfo: { flex: 1 },
  orgName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  orgPhone: { fontSize: 13, color: '#666' },
  orgAddress: { fontSize: 12, color: '#999', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  messageBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  messageLabel: { fontSize: 11, color: '#999', marginBottom: 4 },
  messageText: { fontSize: 13, color: '#444', fontStyle: 'italic' },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  dateText: { fontSize: 12, color: '#999' },
  expiringSoon: { color: '#FF9800', fontWeight: '600' },
  actions: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  actionButtons: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  rejectBtnText: { fontSize: 14, fontWeight: '600', color: '#666' },
  acceptBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
  },
  acceptBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  disabledBtn: { opacity: 0.6 },
  rejectInputContainer: { gap: 8 },
  rejectInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  rejectButtons: { flexDirection: 'row', gap: 8 },
  cancelRejectBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelRejectText: { fontSize: 14, color: '#666' },
  confirmRejectBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F44336',
    alignItems: 'center',
  },
  confirmRejectText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20 },
});

export default JoinRequestsScreen;
