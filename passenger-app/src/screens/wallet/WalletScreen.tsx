import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { walletApi, Wallet, WalletTransaction, TapSession } from '../../services/api/wallet';
import { usePassengerLocation } from '../../hooks/usePassengerLocation';
import { useNearbyBuses } from '../../hooks/useNearbyBuses';

const WalletScreen: React.FC = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [activeSession, setActiveSession] = useState<TapSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'wallet' | 'tap' | 'history'>('wallet');

  const { location } = usePassengerLocation();
  const { nearestBus } = useNearbyBuses({
    latitude: location.latitude,
    longitude: location.longitude,
    radius: 2,
    enabled: !location.loading && activeTab === 'tap',
  });

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [walletRes, transactionsRes, sessionRes] = await Promise.all([
        walletApi.getWallet(),
        walletApi.getTransactions(),
        walletApi.getActiveSession(),
      ]);
      setWallet(walletRes.wallet);
      setTransactions(transactionsRes.transactions);
      setActiveSession(sessionRes.session);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    try {
      const response = await walletApi.topUp(amount);
      setWallet(response.wallet);
      setTransactions([response.transaction, ...transactions]);
      setShowTopUpModal(false);
      setTopUpAmount('');
      Alert.alert('Success', `Rs. ${amount} added to your wallet`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to top up wallet');
    }
  };

  const handleTapIn = async () => {
    if (!nearestBus) {
      Alert.alert('No Bus Nearby', 'Please wait for a bus to arrive');
      return;
    }

    if (wallet && wallet.balance < nearestBus.route.basePrice) {
      Alert.alert('Insufficient Balance', 'Please top up your wallet first');
      return;
    }

    try {
      const response = await walletApi.tapIn({
        routeId: nearestBus.route.id,
        vehicleId: nearestBus.vehicle.id,
        driverId: nearestBus.driverId,
        latitude: location.latitude,
        longitude: location.longitude,
        location: location.city || 'Unknown',
      });
      setActiveSession(response.session);
      Alert.alert('Success', response.message);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to tap in');
    }
  };

  const handleTapOut = async () => {
    if (!activeSession) {
      Alert.alert('No Active Session', 'You need to tap in first');
      return;
    }

    try {
      const response = await walletApi.tapOut({
        latitude: location.latitude,
        longitude: location.longitude,
        location: location.city || 'Unknown',
      });
      setActiveSession(null);
      setWallet(prev => prev ? { ...prev, balance: prev.balance - (response.session.actualFare || 0) } : null);
      await fetchWalletData();
      Alert.alert('Success', response.message);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to tap out');
    }
  };

  const renderWalletTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Wallet Balance</Text>
        <Text style={styles.balanceAmount}>Rs. {wallet?.balance.toFixed(2) || '0.00'}</Text>
        <TouchableOpacity style={styles.topUpButton} onPress={() => setShowTopUpModal(true)}>
          <Text style={styles.topUpButtonText}>+ Top Up</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => setActiveTab('tap')}>
          <Text style={styles.actionIcon}>🚌</Text>
          <Text style={styles.actionText}>Tap In/Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => setActiveTab('history')}>
          <Text style={styles.actionIcon}>📜</Text>
          <Text style={styles.actionText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {transactions.slice(0, 5).map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionIcon}>
              <Text style={styles.transactionIconText}>
                {transaction.type === 'TOP_UP' ? '💰' : transaction.type === 'TAP_IN' ? '🚌' : '🏁'}
              </Text>
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionDescription}>{transaction.description}</Text>
              <Text style={styles.transactionDate}>
                {new Date(transaction.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={[
              styles.transactionAmount,
              transaction.amount >= 0 ? styles.amountPositive : styles.amountNegative
            ]}>
              {transaction.amount >= 0 ? '+' : ''}Rs. {Math.abs(transaction.amount).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderTapTab = () => (
    <ScrollView style={styles.tabContent}>
      {activeSession ? (
        /* Active Session */
        <View style={styles.activeSessionCard}>
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionTitle}>Active Trip</Text>
            <View style={styles.sessionBadge}>
              <Text style={styles.sessionBadgeText}>IN PROGRESS</Text>
            </View>
          </View>

          <View style={styles.sessionInfo}>
            <Text style={styles.sessionRoute}>{activeSession.route.name}</Text>
            <Text style={styles.sessionDetail}>
              Tapped in at: {new Date(activeSession.tapInAt).toLocaleTimeString()}
            </Text>
            {activeSession.tapInLocation && (
              <Text style={styles.sessionDetail}>Location: {activeSession.tapInLocation}</Text>
            )}
            <Text style={styles.sessionFare}>Estimated Fare: Rs. {activeSession.estimatedFare}</Text>
          </View>

          <TouchableOpacity style={styles.tapOutButton} onPress={handleTapOut}>
            <Text style={styles.tapOutButtonText}>🏁 Tap Out</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Tap In */
        <View style={styles.tapInCard}>
          <Text style={styles.tapInTitle}>Ready to Board?</Text>
          <Text style={styles.tapInSubtitle}>Tap in when you board the bus</Text>

          {nearestBus ? (
            <View style={styles.busInfoCard}>
              <Text style={styles.busInfoTitle}>Nearest Bus</Text>
              <Text style={styles.busInfoRoute}>{nearestBus.route.name}</Text>
              <Text style={styles.busInfoDetails}>
                Bus {nearestBus.route.routeNumber || nearestBus.vehicle.plateNumber}
              </Text>
              <Text style={styles.busInfoEta}>Arriving in {nearestBus.etaText}</Text>
              <Text style={styles.busInfoFare}>Fare: Rs. {nearestBus.route.basePrice}</Text>
            </View>
          ) : (
            <View style={styles.noBusCard}>
              <Text style={styles.noBusText}>No buses nearby</Text>
              <Text style={styles.noBusSubtext}>Waiting for buses...</Text>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.tapInButton, !nearestBus && styles.tapInButtonDisabled]} 
            onPress={handleTapIn}
            disabled={!nearestBus}
          >
            <Text style={styles.tapInButtonText}>🚌 Tap In</Text>
          </TouchableOpacity>

          {wallet && wallet.balance < 50 && (
            <View style={styles.lowBalanceWarning}>
              <Text style={styles.lowBalanceText}>⚠️ Low balance. Please top up soon.</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );

  const renderHistoryTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Transaction History</Text>
      {transactions.map((transaction) => (
        <View key={transaction.id} style={styles.historyItem}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyType}>{transaction.type.replace('_', ' ')}</Text>
            <Text style={[
              styles.historyAmount,
              transaction.amount >= 0 ? styles.amountPositive : styles.amountNegative
            ]}>
              {transaction.amount >= 0 ? '+' : ''}Rs. {Math.abs(transaction.amount).toFixed(2)}
            </Text>
          </View>
          <Text style={styles.historyDescription}>{transaction.description}</Text>
          <Text style={styles.historyDate}>
            {new Date(transaction.createdAt).toLocaleString()}
          </Text>
          <View style={styles.historyBalance}>
            <Text style={styles.historyBalanceText}>
              Balance: Rs. {transaction.balanceAfter.toFixed(2)}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'wallet' && styles.tabActive]}
          onPress={() => setActiveTab('wallet')}
        >
          <Text style={[styles.tabText, activeTab === 'wallet' && styles.tabTextActive]}>
            💳 Wallet
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'tap' && styles.tabActive]}
          onPress={() => setActiveTab('tap')}
        >
          <Text style={[styles.tabText, activeTab === 'tap' && styles.tabTextActive]}>
            🚌 Tap
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            📜 History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'wallet' && renderWalletTab()}
      {activeTab === 'tap' && renderTapTab()}
      {activeTab === 'history' && renderHistoryTab()}

      {/* Top Up Modal */}
      <Modal visible={showTopUpModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Top Up Wallet</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter amount"
              keyboardType="numeric"
              value={topUpAmount}
              onChangeText={setTopUpAmount}
            />
            <View style={styles.quickAmounts}>
              {[100, 500, 1000, 2000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.quickAmountButton}
                  onPress={() => setTopUpAmount(amount.toString())}
                >
                  <Text style={styles.quickAmountText}>Rs. {amount}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonCancel} 
                onPress={() => {
                  setShowTopUpModal(false);
                  setTopUpAmount('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonConfirm} onPress={handleTopUp}>
                <Text style={styles.modalButtonConfirmText}>Top Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  balanceCard: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  topUpButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  topUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  amountPositive: {
    color: '#4CAF50',
  },
  amountNegative: {
    color: '#f44336',
  },
  activeSessionCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  sessionBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sessionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  sessionInfo: {
    marginBottom: 20,
  },
  sessionRoute: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sessionDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  sessionFare: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 8,
  },
  tapOutButton: {
    backgroundColor: '#f44336',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  tapOutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  tapInCard: {
    margin: 20,
  },
  tapInTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  tapInSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  busInfoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  busInfoTitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  busInfoRoute: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  busInfoDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  busInfoEta: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginBottom: 8,
  },
  busInfoFare: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  noBusCard: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  noBusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  noBusSubtext: {
    fontSize: 14,
    color: '#999',
  },
  tapInButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  tapInButtonDisabled: {
    backgroundColor: '#ccc',
  },
  tapInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  lowBalanceWarning: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  lowBalanceText: {
    fontSize: 13,
    color: '#856404',
    textAlign: 'center',
  },
  historyItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  historyBalance: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  historyBalanceText: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    marginBottom: 16,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  quickAmountButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f0f7ff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalButtonConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default WalletScreen;
