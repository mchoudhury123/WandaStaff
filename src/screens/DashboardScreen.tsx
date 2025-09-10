import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { firestore } from '@/services/firebase';
import { ClockService } from '@/services/clockService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppConstants } from '../config/Constants';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [clockStatus, setClockStatus] = useState({ isClocked: false, clockedInAt: null, canShowClockedIn: true });
  const [weeklyHours, setWeeklyHours] = useState(0);
  const [locationCheckLoading, setLocationCheckLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user) {
      loadClockStatus();
      calculateWeeklyHours();
    }
  }, [user]);

  // Auto-refresh clock status every 30 seconds when app is active
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadClockStatus();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  // Listen for clock status changes from other screens
  useEffect(() => {
    const handleClockStatusChange = () => {
      if (user) {
        loadClockStatus();
        calculateWeeklyHours();
      }
    };

    // Simple event system for real-time updates
    if (!global.eventEmitter) {
      global.eventEmitter = {
        listeners: {},
        emit: function(event) {
          if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback());
          }
        },
        on: function(event, callback) {
          if (!this.listeners[event]) {
            this.listeners[event] = [];
          }
          this.listeners[event].push(callback);
        },
        off: function(event, callback) {
          if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
          }
        }
      };
    }

    global.eventEmitter.on('clockStatusChanged', handleClockStatusChange);

    return () => {
      if (global.eventEmitter) {
        global.eventEmitter.off('clockStatusChanged', handleClockStatusChange);
      }
    };
  }, [user]);

  // Add focus event listener to refresh when returning to dashboard
  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      if (user) {
        loadClockStatus();
        calculateWeeklyHours();
      }
    });

    return unsubscribe;
  }, [navigation, user]);

  const loadData = async () => {
    try {
      const staffData = await AsyncStorage.getItem('staff');
      if (staffData) {
        const staff = JSON.parse(staffData);
        console.log('Dashboard - Loaded staff:', staff.firstName, staff.lastName);
        setUser(staff);
        
        // Load business info from Firebase
        if (staff.businessId) {
          console.log('Dashboard - Loading business with ID:', staff.businessId);
          try {
            const businessDoc = await getDoc(doc(firestore, 'businesses', staff.businessId));
            if (businessDoc.exists()) {
              const businessData = businessDoc.data();
              console.log('Dashboard - Loaded business:', businessData.name);
              setBusiness({ name: businessData.name, ...businessData });
            } else {
              console.log('Dashboard - Business document not found');
              setBusiness({ name: 'Your Salon' });
            }
          } catch (businessError) {
            console.error('Dashboard - Error loading business:', businessError);
            setBusiness({ name: 'Your Salon' });
          }
        } else {
          setBusiness({ name: 'Your Salon' });
        }
      }
    } catch (error) {
      console.log('Error loading data:', error);
    }
  };

  const loadClockStatus = async () => {
    if (!user) return;
    
    setLocationCheckLoading(true);
    try {
      // Get actual clock status from Firestore
      const userClockStatus = await ClockService.getUserClockStatus(user.id);
      
      // Check location permission for showing clocked-in status
      const locationCheck = await ClockService.checkLocationForClockStatus(user.id, user.businessId);
      
      // User can only be shown as clocked in if:
      // 1. They are actually clocked in according to records
      // 2. They are within configured radius of business location
      const canShowAsClocked = userClockStatus.status === 'clocked-in' && locationCheck.canShowClockedIn;
      
      setClockStatus({
        isClocked: canShowAsClocked,
        clockedInAt: userClockStatus.lastUpdated?.toDate().toISOString() || null,
        canShowClockedIn: locationCheck.canShowClockedIn,
        actualStatus: userClockStatus.status,
        distance: locationCheck.distance,
        lastClockTime: userClockStatus.lastUpdated?.toDate().toISOString() || null
      });
    } catch (error) {
      console.log('Error loading clock status:', error);
      setClockStatus({
        isClocked: false,
        clockedInAt: null,
        canShowClockedIn: false
      });
    } finally {
      setLocationCheckLoading(false);
    }
  };

  const calculateWeeklyHours = async () => {
    if (!user) return;
    
    try {
      // Get actual clock records for this week from Firestore
      const weeklyRecords = await ClockService.getWeeklyClockRecords(user.id);
      
      // Calculate total hours worked
      const hours = ClockService.calculateWeeklyHours(weeklyRecords);
      
      setWeeklyHours(Math.round(hours * 10) / 10); // Round to 1 decimal
    } catch (error) {
      console.log('Error calculating weekly hours:', error);
      setWeeklyHours(0);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section - Similar to Plum's main card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <Text style={styles.businessLabel}>Your workplace</Text>
          <TouchableOpacity style={styles.addButton}>
            <Icon name="clock-plus" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Clock In</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.businessName}>{business?.name || 'Loading...'}</Text>
        <Text style={styles.welcomeText}>
          <Icon name="trending-up" size={16} color="#FFFFFF" /> {getGreeting()}, {user.firstName}
        </Text>
      </View>

      {/* Quick Stats Grid - Similar to Plum's Pockets/Investments */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Icon name="calendar-today" size={20} color="#8B5CF6" />
            <Text style={styles.statTitle}>Today</Text>
          </View>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statSubtext}>appointments</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Icon name="clock-outline" size={20} color="#10B981" />
            <Text style={styles.statTitle}>Hours</Text>
          </View>
          <Text style={styles.statValue}>{weeklyHours}</Text>
          <Text style={styles.statSubtext}>worked this week</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Icon name="account-group" size={20} color="#F59E0B" />
            <Text style={styles.statTitle}>Role</Text>
          </View>
          <Text style={styles.statRole}>{user.role}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Icon name="map-marker" size={20} color="#EF4444" />
            <Text style={styles.statTitle}>Status</Text>
          </View>
          <Text style={styles.statStatus}>Ready</Text>
        </View>
      </View>

      {/* Clock Status Section */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View style={styles.progressIcon}>
            <View style={[
              styles.progressCircle,
              { backgroundColor: clockStatus.isClocked ? '#10B981' : '#EF4444' }
            ]}>
              <Icon 
                name={clockStatus.isClocked ? 'clock-in' : 'clock-out'} 
                size={20} 
                color="#FFFFFF" 
              />
            </View>
          </View>
          <View style={styles.progressText}>
            <Text style={styles.progressTitle}>
              {locationCheckLoading 
                ? 'Checking location...'
                : clockStatus.isClocked 
                  ? 'Currently clocked in' 
                  : clockStatus.actualStatus === 'clocked-in' && !clockStatus.canShowClockedIn
                    ? 'Clocked in (Outside work area)'
                    : 'Currently clocked out'
              }
            </Text>
            <Text style={styles.progressSubtext}>
              {locationCheckLoading 
                ? 'Verifying your location...'
                : clockStatus.isClocked && clockStatus.clockedInAt 
                  ? `Since ${new Date(clockStatus.clockedInAt).toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit', 
                      hour12: true 
                    })}`
                  : clockStatus.actualStatus === 'clocked-in' && !clockStatus.canShowClockedIn
                    ? `You're ${clockStatus.distance}m from work location`
                    : clockStatus.clockedInAt
                      ? `Last clock time ${new Date(clockStatus.clockedInAt).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          hour12: true 
                        })}`
                      : 'Tap to clock in when ready'
              }
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => navigation?.navigate('Schedule')}
            style={styles.clockNavButton}
          >
            <Icon name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions - Similar to Plum's Brain section */}
      <View style={styles.actionsSection}>
        <View style={styles.actionHeader}>
          <Icon name="lightning-bolt" size={24} color="#8B5CF6" />
          <Text style={styles.actionTitle}>Quick Actions</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation?.navigate('Schedule')}
        >
          <View style={styles.actionButtonContent}>
            <Icon name="clock-in" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Clock In/Out</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation?.navigate('Schedule')}
        >
          <View style={styles.actionButtonContent}>
            <Icon name="calendar-month" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>My Schedule</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation?.navigate('Profile')}
        >
          <View style={styles.actionButtonContent}>
            <Icon name="account-circle" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>My Profile</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
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
    fontSize: 18,
    color: '#64748B',
  },
  
  // Header Card - Similar to Plum's main purple card
  headerCard: {
    backgroundColor: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    // Fallback for gradient
    backgroundColor: '#8B5CF6',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  businessLabel: {
    color: '#E0E7FF',
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  businessName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeText: {
    color: '#E0E7FF',
    fontSize: 16,
    fontWeight: '500',
  },

  // Stats Grid - Similar to Plum's Pockets/Investments
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statRole: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    textTransform: 'capitalize',
  },
  statStatus: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
  },

  // Progress Card - Similar to Plum's "Get set up"
  progressCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressIcon: {
    marginRight: 16,
  },
  progressCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressText: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  progressSubtext: {
    fontSize: 14,
    color: '#64748B',
  },
  clockNavButton: {
    padding: 4,
  },

  // Actions Section - Similar to Plum's Brain section
  actionsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 12,
  },
  actionButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 16,
  },

  bottomSpacing: {
    height: 40,
  },
});

export default DashboardScreen;