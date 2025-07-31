import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  Chip,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '@/services/firebase';
import { NavigationProps, HolidayRequest, Staff } from '@/types';

const AnnualLeaveScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const theme = useTheme();
  const [user, setUser] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState({ allowance: 0, used: 0, remaining: 0 });
  const [holidayRequests, setHolidayRequests] = useState<HolidayRequest[]>([]);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      loadLeaveData();
    }
  }, [user]);

  // Refresh data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation?.addListener('focus', () => {
      if (user) {
        loadLeaveData();
      }
    });

    return unsubscribe;
  }, [navigation, user]);

  const loadUserData = async () => {
    try {
      const staffData = await AsyncStorage.getItem('staff');
      if (staffData) {
        const staff = JSON.parse(staffData);
        setUser(staff);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadLeaveData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get staff data including annual leave allowance
      const staffDoc = await getDoc(doc(firestore, 'staff', user.id));
      const staffData = staffDoc.exists() ? staffDoc.data() : null;
      const allowance = staffData?.annualLeaveAllowance || 25; // Default 25 days

      // Get all holiday requests for this user
      const requestsQuery = query(
        collection(firestore, 'holidayRequests'),
        where('staffId', '==', user.id)
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      
      const requests: HolidayRequest[] = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HolidayRequest[];

      // Calculate used days (approved requests)
      const currentYear = new Date().getFullYear().toString();
      const usedDays = requests
        .filter(req => 
          req.status === 'approved' && 
          req.startDate.startsWith(currentYear)
        )
        .reduce((total, req) => total + req.days, 0);

      setLeaveBalance({
        allowance,
        used: usedDays,
        remaining: allowance - usedDays
      });
      
      setHolidayRequests(requests.sort((a, b) => 
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      ));

    } catch (error) {
      console.error('Error loading leave data:', error);
      Alert.alert('Error', 'Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const requestLeave = () => {
    navigation?.navigate('RequestLeave', { 
      remainingDays: leaveBalance.remaining,
      allowance: leaveBalance.allowance,
      used: leaveBalance.used
    });
  };

  const submitDemoRequest = async () => {
    if (!user) return;

    setSubmitting(true);
    try {
      // Create a demo holiday request
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7); // 7 days from now
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 4); // 5 day holiday

      const holidayRequest: Omit<HolidayRequest, 'id'> = {
        staffId: user.id,
        staffName: `${user.firstName} ${user.lastName}`,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days: 5,
        reason: 'Annual holiday',
        status: 'pending',
        requestedAt: new Date().toISOString()
      };

      await addDoc(collection(firestore, 'holidayRequests'), holidayRequest);
      
      Alert.alert('Success', 'Holiday request submitted successfully!');
      loadLeaveData(); // Refresh data
      
    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', 'Failed to submit holiday request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'cancelled': return '#6B7280';
      default: return '#F59E0B';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return 'check-circle';
      case 'rejected': return 'close-circle';
      case 'cancelled': return 'cancel';
      default: return 'clock-outline';
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadLeaveData} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Leave Balance Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Annual Leave Balance</Title>
            
            <View style={styles.balanceContainer}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceValue}>{leaveBalance.allowance}</Text>
                <Text style={styles.balanceLabel}>Total Allowance</Text>
              </View>
              
              <View style={styles.balanceItem}>
                <Text style={[styles.balanceValue, { color: '#EF4444' }]}>{leaveBalance.used}</Text>
                <Text style={styles.balanceLabel}>Days Used</Text>
              </View>
              
              <View style={styles.balanceItem}>
                <Text style={[styles.balanceValue, { color: '#10B981' }]}>{leaveBalance.remaining}</Text>
                <Text style={styles.balanceLabel}>Days Remaining</Text>
              </View>
            </View>

            <Button
              mode="contained"
              onPress={requestLeave}
              loading={submitting}
              disabled={submitting || leaveBalance.remaining <= 0}
              style={styles.requestButton}
              icon="calendar-plus"
            >
              Request Annual Leave
            </Button>
          </Card.Content>
        </Card>

        {/* Holiday Requests History */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Your Requests</Title>
            
            {holidayRequests.length > 0 ? (
              holidayRequests.map((request) => (
                <View key={request.id} style={styles.requestItem}>
                  <View style={styles.requestHeader}>
                    <View style={styles.requestDates}>
                      <Text style={styles.requestDateText}>
                        {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                      </Text>
                      <Text style={styles.requestDaysText}>{request.days} days</Text>
                    </View>
                    
                    <Chip
                      icon={getStatusIcon(request.status)}
                      textStyle={{ color: getStatusColor(request.status) }}
                      style={{ backgroundColor: `${getStatusColor(request.status)}20` }}
                    >
                      {request.status.toUpperCase()}
                    </Chip>
                  </View>
                  
                  <Text style={styles.requestReason}>{request.reason}</Text>
                  <Text style={styles.requestDate}>
                    Requested {new Date(request.requestedAt).toLocaleDateString()}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="calendar-remove" size={48} color="#94A3B8" />
                <Text style={styles.emptyText}>No holiday requests yet</Text>
                <Button 
                  mode="contained" 
                  onPress={requestLeave}
                  style={{ marginTop: 16 }}
                  disabled={submitting || leaveBalance.remaining <= 0}
                >
                  Request Annual Leave
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  
  // Balance Section
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  requestButton: {
    marginTop: 8,
  },

  // Requests Section
  requestItem: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestDates: {
    flex: 1,
  },
  requestDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  requestDaysText: {
    fontSize: 14,
    color: '#6B7280',
  },
  requestReason: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default AnnualLeaveScreen;