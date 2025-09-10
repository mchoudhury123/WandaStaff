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
  Paragraph,
  Button,
  Text,
  useTheme,
  ActivityIndicator,
  List,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Platform } from 'react-native';

// Only import Maps on mobile platforms
let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== 'web') {
  try {
    const MapComponents = require('react-native-maps');
    MapView = MapComponents.default;
    Marker = MapComponents.Marker;
  } catch (e) {
    console.log('Maps not available');
  }
}

import { useAuth } from '@/components/common/AuthContext';
import { NavigationProps, ClockRecord } from '@/types';
import { ClockService } from '@/services/clockService';

const ClockInOutScreen: React.FC<NavigationProps> = () => {
  const { user } = useAuth();
  const theme = useTheme();
  
  const [lastClockRecord, setLastClockRecord] = useState<ClockRecord | null>(null);
  const [todayRecords, setTodayRecords] = useState<ClockRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [businessLocation, setBusinessLocation] = useState<{ lat: number; lng: number } | null>(null);

  const loadClockData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [lastRecord, records] = await Promise.all([
        ClockService.getLastClockRecord(user.id),
        ClockService.getTodayClockRecords(user.id),
      ]);

      setLastClockRecord(lastRecord);
      setTodayRecords(records);

      // Get business location
      const business = await ClockService.getBusinessLocation(user.businessId);
      setBusinessLocation(business.location);

      // Get current location
      const hasPermission = await ClockService.requestLocationPermission();
      if (hasPermission) {
        const location = await ClockService.getCurrentLocation();
        setCurrentLocation(location);
      }
    } catch (error) {
      console.error('Error loading clock data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClockData();
  }, [user]);

  const handleClockIn = async () => {
    if (!user) return;

    Alert.alert(
      'Clock In',
      'Are you sure you want to clock in?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clock In',
          onPress: async () => {
            setActionLoading(true);
            try {
              await ClockService.clockIn(user);
              const clockInTime = new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
              
              Alert.alert(
                'Clocked In Successfully',
                `Clocked in at ${clockInTime}`,
                [
                  {
                    text: 'Confirm',
                    onPress: () => {
                      loadClockData();
                      // Broadcast to other screens that clock status changed
                      if (global.eventEmitter) {
                        global.eventEmitter.emit('clockStatusChanged');
                      }
                    }
                  }
                ]
              );
            } catch (error: any) {
              Alert.alert('Clock In Failed', error.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleClockOut = async () => {
    if (!user) return;

    Alert.alert(
      'Clock Out',
      'Are you sure you want to clock out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clock Out',
          onPress: async () => {
            setActionLoading(true);
            try {
              await ClockService.clockOut(user);
              const clockOutTime = new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
              
              Alert.alert(
                'Clocked Out Successfully',
                `Clocked out at ${clockOutTime}`,
                [
                  {
                    text: 'Confirm',
                    onPress: () => {
                      loadClockData();
                      // Broadcast to other screens that clock status changed
                      if (global.eventEmitter) {
                        global.eventEmitter.emit('clockStatusChanged');
                      }
                    }
                  }
                ]
              );
            } catch (error: any) {
              Alert.alert('Clock Out Failed', error.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const getCurrentStatus = () => {
    if (!lastClockRecord) return { status: 'Not clocked in', canClockIn: true };
    
    const today = new Date().toDateString();
    const recordDate = lastClockRecord.timestamp.toDate().toDateString();
    
    if (recordDate !== today) {
      return { status: 'Not clocked in today', canClockIn: true };
    }
    
    // Check location for current status
    if (currentLocation && businessLocation) {
      const distance = ClockService.calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        businessLocation.lat,
        businessLocation.lng
      );
      
      // Check if user is outside allowed range
      if (distance > AppConstants.business.defaultClockRadiusMeters) {
        return { 
          status: lastClockRecord.type === 'clock-in' 
            ? `Clocked in (${Math.round(distance)}m from workplace)` 
            : 'Outside work area', 
          canClockIn: false,
          isOutsideRange: true
        };
      }
    }
    
    if (lastClockRecord.type === 'clock-in') {
      return { status: 'Currently clocked in', canClockIn: false };
    } else {
      return { status: 'Clocked out', canClockIn: true };
    }
  };

  const formatTime = (timestamp: any) => {
    return timestamp.toDate().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return null;
  }

  const currentStatus = getCurrentStatus();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadClockData} />
      }
    >
      {/* Current Status */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.statusHeader}>
            <Icon
              name="clock-outline"
              size={32}
              color={currentStatus.canClockIn ? theme.colors.error : theme.colors.primary}
            />
            <View style={styles.statusText}>
              <Title>Clock Status</Title>
              <Text style={[
                styles.statusValue,
                { color: currentStatus.canClockIn ? theme.colors.error : theme.colors.primary }
              ]}>
                {currentStatus.status}
              </Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={currentStatus.canClockIn ? handleClockIn : handleClockOut}
              loading={actionLoading}
              disabled={actionLoading || currentStatus.isOutsideRange}
              style={[
                styles.actionButton,
                {
                  backgroundColor: currentStatus.isOutsideRange
                    ? theme.colors.surface
                    : currentStatus.canClockIn
                      ? theme.colors.primary
                      : theme.colors.error
                }
              ]}
            >
              {currentStatus.isOutsideRange 
                ? 'Too far from workplace'
                : currentStatus.canClockIn 
                  ? 'Clock In' 
                  : 'Clock Out'
              }
            </Button>
            
            {currentStatus.isOutsideRange && (
              <Text style={styles.locationWarning}>
                You must be within {AppConstants.business.defaultClockRadiusMeters}m of the workplace to clock in/out
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Location Map */}
      {currentLocation && businessLocation && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Your Location</Title>
            {Platform.OS === 'web' ? (
              <View style={styles.webLocationContainer}>
                <Text style={styles.locationText}>Current Location: Dubai, UAE (Web Test)</Text>
                <Text style={styles.locationText}>Business Location: Wanda Salon</Text>
                <Text style={styles.locationText}>Distance: Within allowed range</Text>
              </View>
            ) : (
              MapView && (
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    region={{
                      latitude: currentLocation.lat,
                      longitude: currentLocation.lng,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                  >
                    <Marker
                      coordinate={{
                        latitude: currentLocation.lat,
                        longitude: currentLocation.lng,
                      }}
                      title="Your Location"
                      description="Current position"
                      pinColor="blue"
                    />
                    <Marker
                      coordinate={{
                        latitude: businessLocation.lat,
                        longitude: businessLocation.lng,
                      }}
                      title="Business Location"
                      description="Clock in/out zone"
                      pinColor="red"
                    />
                  </MapView>
                </View>
              )
            )}
            <Text style={styles.mapNote}>
              {Platform.OS === 'web' 
                ? 'Location verification is simulated for web testing'
                : `You must be within ${AppConstants.business.defaultClockRadiusMeters}m of the business location to clock in/out`
              }
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Today's Records */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Today's Records</Title>
          {todayRecords.length > 0 ? (
            todayRecords.map((record, index) => (
              <List.Item
                key={index}
                title={record.type === 'clock-in' ? 'Clocked In' : 'Clocked Out'}
                description={`${formatTime(record.timestamp)} • ${record.address}`}
                left={() => (
                  <List.Icon
                    icon={record.type === 'clock-in' ? 'clock-in' : 'clock-out'}
                    color={record.type === 'clock-in' ? theme.colors.primary : theme.colors.error}
                  />
                )}
                right={() => (
                  <Text style={styles.distanceText}>
                    {record.distanceFromBusiness}m
                  </Text>
                )}
              />
            ))
          ) : (
            <Text style={styles.noRecords}>No clock records today</Text>
          )}
        </Card.Content>
      </Card>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    marginLeft: 16,
    flex: 1,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtons: {
    marginTop: 16,
  },
  actionButton: {
    paddingVertical: 8,
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 12,
  },
  map: {
    flex: 1,
  },
  mapNote: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 8,
  },
  webLocationContainer: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 12,
  },
  locationText: {
    fontSize: 14,
    marginBottom: 8,
  },
  distanceText: {
    fontSize: 12,
    opacity: 0.7,
    alignSelf: 'center',
  },
  noRecords: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 16,
  },
  locationWarning: {
    fontSize: 12,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ClockInOutScreen;