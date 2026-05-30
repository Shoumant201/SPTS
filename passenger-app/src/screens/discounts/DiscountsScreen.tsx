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
import {
  discountApi,
  DiscountType,
  DiscountApplication,
  ApplyDiscountData,
} from '../../services/api/discounts';

const DiscountsScreen: React.FC = () => {
  const [applications, setApplications] = useState<DiscountApplication[]>([]);
  const [activeDiscount, setActiveDiscount] = useState<DiscountApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedType, setSelectedType] = useState<DiscountType | null>(null);
  const [formData, setFormData] = useState<ApplyDiscountData>({
    type: 'STUDENT',
    idNumber: '',
    institutionName: '',
    reason: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [applicationsRes, activeRes] = await Promise.all([
        discountApi.getMyApplications(),
        discountApi.getActiveDiscount(),
      ]);
      setApplications(applicationsRes.applications);
      setActiveDiscount(activeRes.discount);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load discount data');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedType) {
      Alert.alert('Select Type', 'Please select a discount type');
      return;
    }

    if (!formData.idNumber?.trim()) {
      Alert.alert('ID Required', 'Please enter your ID number');
      return;
    }

    try {
      const response = await discountApi.applyForDiscount({
        ...formData,
        type: selectedType,
      });
      Alert.alert('Success', response.message);
      setShowApplyModal(false);
      setSelectedType(null);
      setFormData({
        type: 'STUDENT',
        idNumber: '',
        institutionName: '',
        reason: '',
      });
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit application');
    }
  };

  const handleCancel = async (id: string) => {
    Alert.alert(
      'Cancel Application',
      'Are you sure you want to cancel this application?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await discountApi.cancelApplication(id);
              Alert.alert('Success', 'Application cancelled');
              fetchData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel application');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return '#4CAF50';
      case 'PENDING':
        return '#FF9800';
      case 'REJECTED':
        return '#f44336';
      case 'EXPIRED':
        return '#999';
      default:
        return '#666';
    }
  };

  const getDiscountIcon = (type: DiscountType) => {
    switch (type) {
      case 'STUDENT':
        return '🎓';
      case 'ELDERLY':
        return '👴';
      case 'DISABLED':
        return '♿';
      case 'VETERAN':
        return '🎖️';
      case 'LOW_INCOME':
        return '💰';
      default:
        return '🎫';
    }
  };

  const discountTypes: { type: DiscountType; label: string; percentage: number; description: string }[] = [
    { type: 'STUDENT', label: 'Student', percentage: 50, description: 'For students with valid ID' },
    { type: 'ELDERLY', label: 'Elderly', percentage: 50, description: 'For citizens 60+ years' },
    { type: 'DISABLED', label: 'Disabled', percentage: 75, description: 'For persons with disabilities' },
    { type: 'VETERAN', label: 'Veteran', percentage: 60, description: 'For military veterans' },
    { type: 'LOW_INCOME', label: 'Low Income', percentage: 40, description: 'For low-income families' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading discounts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Active Discount Card */}
        {activeDiscount ? (
          <View style={styles.activeCard}>
            <View style={styles.activeHeader}>
              <Text style={styles.activeIcon}>{getDiscountIcon(activeDiscount.type)}</Text>
              <View style={styles.activeInfo}>
                <Text style={styles.activeTitle}>Active Discount</Text>
                <Text style={styles.activeType}>{activeDiscount.type}</Text>
              </View>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>{activeDiscount.discountPercentage}% OFF</Text>
              </View>
            </View>
            <Text style={styles.activeDescription}>
              Your discount is active and will be automatically applied to all trips
            </Text>
            {activeDiscount.expiryDate && (
              <Text style={styles.activeExpiry}>
                Expires: {new Date(activeDiscount.expiryDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.noActiveCard}>
            <Text style={styles.noActiveIcon}>🎫</Text>
            <Text style={styles.noActiveTitle}>No Active Discount</Text>
            <Text style={styles.noActiveText}>Apply for a discount to save on your trips</Text>
          </View>
        )}

        {/* Apply for Discount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Discounts</Text>
          {discountTypes.map((discount) => (
            <TouchableOpacity
              key={discount.type}
              style={styles.discountCard}
              onPress={() => {
                setSelectedType(discount.type);
                setFormData({ ...formData, type: discount.type });
                setShowApplyModal(true);
              }}
            >
              <Text style={styles.discountIcon}>{getDiscountIcon(discount.type)}</Text>
              <View style={styles.discountInfo}>
                <Text style={styles.discountLabel}>{discount.label}</Text>
                <Text style={styles.discountDescription}>{discount.description}</Text>
              </View>
              <View style={styles.discountBadge}>
                <Text style={styles.discountPercentage}>{discount.percentage}%</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* My Applications */}
        {applications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Applications</Text>
            {applications.map((app) => (
              <View key={app.id} style={styles.applicationCard}>
                <View style={styles.applicationHeader}>
                  <View style={styles.applicationLeft}>
                    <Text style={styles.applicationIcon}>{getDiscountIcon(app.type)}</Text>
                    <View>
                      <Text style={styles.applicationType}>{app.type}</Text>
                      <Text style={styles.applicationDate}>
                        Applied: {new Date(app.appliedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(app.status) }]}>
                    <Text style={styles.statusText}>{app.status}</Text>
                  </View>
                </View>
                {app.reviewNotes && (
                  <View style={styles.reviewNotes}>
                    <Text style={styles.reviewNotesLabel}>Review Notes:</Text>
                    <Text style={styles.reviewNotesText}>{app.reviewNotes}</Text>
                  </View>
                )}
                {app.status === 'PENDING' && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancel(app.id)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel Application</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Apply Modal */}
      <Modal visible={showApplyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Apply for {selectedType} Discount
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="ID Number *"
              value={formData.idNumber}
              onChangeText={(text) => setFormData({ ...formData, idNumber: text })}
            />

            {selectedType === 'STUDENT' && (
              <TextInput
                style={styles.modalInput}
                placeholder="Institution Name"
                value={formData.institutionName}
                onChangeText={(text) => setFormData({ ...formData, institutionName: text })}
              />
            )}

            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Reason (optional)"
              value={formData.reason}
              onChangeText={(text) => setFormData({ ...formData, reason: text })}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.modalNote}>
              Note: Your application will be reviewed by our team. You may be asked to provide verification documents.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowApplyModal(false);
                  setSelectedType(null);
                  setFormData({
                    type: 'STUDENT',
                    idNumber: '',
                    institutionName: '',
                    reason: '',
                  });
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonConfirm} onPress={handleApply}>
                <Text style={styles.modalButtonConfirmText}>Submit</Text>
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
  scrollView: {
    flex: 1,
  },
  activeCard: {
    backgroundColor: '#4CAF50',
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  activeInfo: {
    flex: 1,
  },
  activeTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  activeType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  activeBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  activeDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  activeExpiry: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  noActiveCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  noActiveIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.5,
  },
  noActiveTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  noActiveText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  discountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  discountIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  discountInfo: {
    flex: 1,
  },
  discountLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  discountDescription: {
    fontSize: 13,
    color: '#666',
  },
  discountBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  applicationCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  applicationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  applicationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  applicationType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  applicationDate: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  reviewNotes: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewNotesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  reviewNotesText: {
    fontSize: 13,
    color: '#1a1a1a',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    width: '90%',
    maxHeight: '80%',
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
    fontSize: 16,
    marginBottom: 16,
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalNote: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
    lineHeight: 18,
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

export default DiscountsScreen;
