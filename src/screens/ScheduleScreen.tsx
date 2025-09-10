import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  useTheme,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/services/firebase';
// Conditional import for maps - React Native Maps for mobile, Leaflet for web
let MapView, Marker, Circle, LeafletMap, LeafletMarker, LeafletCircle, TileLayer;
let isWeb = false;

try {
  // Try React Native Maps first (mobile)
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Circle = maps.Circle;
} catch (e) {
  try {
    // Fallback to Leaflet for web
    const leaflet = require('react-leaflet');
    const L = require('leaflet');
    
    LeafletMap = leaflet.MapContainer;
    LeafletMarker = leaflet.Marker;
    LeafletCircle = leaflet.Circle;
    TileLayer = leaflet.TileLayer;
    isWeb = true;

    // Fix Leaflet default markers
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  } catch (e2) {
    // No maps available
    MapView = null;
    LeafletMap = null;
  }
}

import { NavigationProps, Rota, ScheduleDay, Business, ClockRecord, Staff } from '@/types';
import { ClockService } from '@/services/clockService';

const { width } = Dimensions.get('window');

const ScheduleScreen: React.FC<NavigationProps> = () => {
  const theme = useTheme();
  
  const [user, setUser] = useState<Staff | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [rota, setRota] = useState<Rota | null>(null);
  const [loading, setLoading] = useState(false);
  const [clockLoading, setClockLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isWithinRange, setIsWithinRange] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [clockStatus, setClockStatus] = useState<{ isClocked: boolean, clockedInAt: string | null }>({ isClocked: false, clockedInAt: null });
  const [lastClockRecord, setLastClockRecord] = useState<ClockRecord | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      loadClockStatus();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const staffData = await AsyncStorage.getItem('staff');
      if (staffData) {
        const staff = JSON.parse(staffData);
        setUser(staff);
        
        // Load business info for location from Firestore
        if (staff.businessId) {
          try {
            console.log('Loading business with ID:', staff.businessId);
            const businessDoc = await getDoc(doc(firestore, 'businesses', staff.businessId));
            if (businessDoc.exists()) {
              const businessData = businessDoc.data();
              console.log('Loaded business coordinates:', businessData.coordinates);
              
              setBusiness({
                id: staff.businessId,
                name: businessData.name || 'Business',
                location: { 
                  lat: businessData.coordinates?.lat || 25.276987, 
                  lng: businessData.coordinates?.lng || 55.296249 
                },
                address: businessData.address || 'Business Address'
              });
            } else {
              console.log('Business document not found, using default coordinates');
              setBusiness({
                id: staff.businessId,
                name: 'Business',
                location: { lat: 25.276987, lng: 55.296249 },
                address: 'Business Address'
              });
            }
          } catch (error) {
            console.error('Error loading business coordinates:', error);
            setBusiness({
              id: staff.businessId,
              name: 'Business',
              location: { lat: 25.276987, lng: 55.296249 },
              address: 'Business Address'
            });
          }
        }
        
        // Load rota data - simulate for now
        loadRotaData(staff.id);
        
        // Load clock status
        loadClockStatus();
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const loadClockStatus = async () => {
    if (!user) return;
    
    try {
      const userClockStatus = await ClockService.getUserClockStatus(user.id);
      const lastRecord = await ClockService.getLastClockRecord(user.id);
      
      setLastClockRecord(lastRecord);
      setClockStatus({
        isClocked: userClockStatus.status === 'clocked-in',
        clockedInAt: userClockStatus.lastUpdated?.toDate().toISOString() || null
      });
    } catch (error) {
      console.error('Error loading clock status:', error);
    }
  };

  const loadRotaData = async (staffId: string) => {
    setLoading(true);
    try {
      // Simulate rota data - replace with Firebase call
      const mockRota: Rota = {
        id: '1',
        staffId: staffId,
        businessId: user?.businessId || '',
        week: getWeekNumber(currentMonth),
        year: currentMonth.getFullYear(),
        schedules: [
          { day: 'monday', isWorking: true, startTime: '09:00', endTime: '17:00' },
          { day: 'tuesday', isWorking: true, startTime: '09:00', endTime: '17:00' },
          { day: 'wednesday', isWorking: false, startTime: '', endTime: '' },
          { day: 'thursday', isWorking: true, startTime: '10:00', endTime: '18:00' },
          { day: 'friday', isWorking: true, startTime: '09:00', endTime: '17:00' },
          { day: 'saturday', isWorking: true, startTime: '09:00', endTime: '15:00' },
          { day: 'sunday', isWorking: false, startTime: '', endTime: '' },
        ]
      };
      setRota(mockRota);
    } catch (error) {
      console.error('Error loading rota:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const getMonthDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    // End on Saturday of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth() && 
           date.getFullYear() === currentMonth.getFullYear();
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  };

  const getRotaForDay = (dayName: string): ScheduleDay | null => {
    if (!rota) return null;
    return rota.schedules.find(s => s.day === dayName.toLowerCase()) || null;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in metres
  };

  const getCurrentPosition = (): Promise<{lat: number, lng: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  const checkLocation = async () => {
    if (!business?.location) {
      Alert.alert('Error', 'Business location not available');
      return;
    }

    try {
      console.log('Getting user location...');
      const currentLocation = await getCurrentPosition();
      console.log('User location:', currentLocation);
      console.log('Business location:', business.location);
      
      setUserLocation(currentLocation);

      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        business.location.lat,
        business.location.lng
      );

      console.log('Distance to business:', distance, 'meters');
      // For testing: always set within range
      const withinRange = true; // Always true for testing
      setIsWithinRange(withinRange);

      // For testing: always show as within range
      Alert.alert('Testing Mode', `You are ${Math.round(distance)}m from the business location. Testing mode: Always within range.`);
    } catch (error) {
      console.error('Error checking location:', error);
      Alert.alert('Location Error', 'Unable to get your current location. Please enable location services and try again.');
    }
  };

  const handleClockAction = async (action: 'clock-in' | 'clock-out') => {
    if (!user || !business) {
      Alert.alert('Error', 'User or business information not available');
      return;
    }

    setClockLoading(true);
    try {
      // Check location first
      await checkLocation();
      
      // Small delay to let the user see the location check result
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!isWithinRange) {
        Alert.alert(
          'Location Required', 
          `You must be within ${AppConstants.business.defaultClockRadiusMeters}m of the business location to clock in/out.`
        );
        return;
      }

      // Perform actual clock action
      if (action === 'clock-in') {
        await ClockService.clockIn(user);
        const clockInTime = new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        
        // Show confirmation popup
        Alert.alert(
          'Clocked In Successfully',
          `Clocked in at ${clockInTime}`,
          [
            {
              text: 'Confirm',
              onPress: () => {
                // Reload clock status after confirmation and broadcast change
                loadClockStatus();
                // Broadcast to other screens that clock status changed
                if (global.eventEmitter) {
                  global.eventEmitter.emit('clockStatusChanged');
                }
              }
            }
          ]
        );
      } else {
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
                // Reload clock status after confirmation and broadcast change
                loadClockStatus();
                // Broadcast to other screens that clock status changed
                if (global.eventEmitter) {
                  global.eventEmitter.emit('clockStatusChanged');
                }
              }
            }
          ]
        );
      }
      
    } catch (error: any) {
      console.error('Clock action error:', error);
      Alert.alert('Error', error.message || 'Failed to record clock action.');
    } finally {
      setClockLoading(false);
    }
  };

  // Auto-check location when business data is loaded
  useEffect(() => {
    if (business && !userLocation) {
      setTimeout(() => {
        checkLocation();
      }, 1000); // Small delay to let UI settle
    }
  }, [business]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
    if (user) {
      loadRotaData(user.id);
    }
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    if (user) {
      loadRotaData(user.id);
    }
  };

  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const calculateHours = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return Math.round(diffHours * 2) / 2; // Round to nearest 0.5 hour
  };

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const monthDays = getMonthDays();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => user && loadRotaData(user.id)} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Month Navigation */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.monthNavigation}>
            <TouchableOpacity 
              onPress={() => navigateMonth('prev')}
              style={styles.navButton}
            >
              <Icon name="chevron-left" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            
            <Text style={styles.monthTitle}>
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            
            <TouchableOpacity 
              onPress={() => navigateMonth('next')}
              style={styles.navButton}
            >
              <Icon name="chevron-right" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={goToToday}
              style={styles.todayButton}
            >
              <Text style={styles.todayButtonText}>TODAY</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>

      {/* Monthly Rota Calendar */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Monthly Rota</Title>
          
          {/* Day Names Header */}
          <View style={styles.dayNamesHeader}>
            {dayNames.map((dayName, index) => (
              <Text key={index} style={styles.dayNameHeader}>
                {dayName}
              </Text>
            ))}
          </View>
          
          {/* Calendar Grid - Apple Calendar Style with proper rows */}
          <View style={styles.monthlyCalendarGrid}>
            {Array.from({ length: Math.ceil(monthDays.length / 7) }, (_, weekIndex) => (
              <View key={weekIndex} style={styles.calendarWeekRow}>
                {monthDays.slice(weekIndex * 7, weekIndex * 7 + 7).map((date, dayIndex) => {
                  const dayName = getDayName(date);
                  const daySchedule = getRotaForDay(dayName);
                  const today = isToday(date);
                  const currentMonthDay = isCurrentMonth(date);
                  
                  const isSelected = selectedDate.toDateString() === date.toDateString();
                  
                  return (
                    <TouchableOpacity 
                      key={dayIndex} 
                      style={[
                        styles.monthDayCell,
                        !currentMonthDay && styles.otherMonthDay
                      ]}
                      onPress={() => handleDatePress(date)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.monthDayNumber,
                        today && styles.todayCircle,
                        isSelected && !today && styles.selectedCircle
                      ]}>
                        <Text style={[
                          styles.dayNumberText,
                          (today || isSelected) && styles.todayText,
                          !currentMonthDay && styles.otherMonthText
                        ]}>
                          {date.getDate()}
                        </Text>
                      </View>
                      
                      {/* Shift indicators - dots under the date */}
                      <View style={styles.shiftIndicators}>
                        {currentMonthDay && daySchedule && daySchedule.isWorking && (
                          <View style={styles.shiftDot} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Selected Date Schedule Details */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.todayScheduleHeader}>
            <Text style={styles.todayDateText}>
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              }).replace(/(\d+)/, '$1' + getOrdinalSuffix(selectedDate.getDate()))}
            </Text>
            
            {(() => {
              const dayName = getDayName(selectedDate);
              const daySchedule = getRotaForDay(dayName);
              const isToday = selectedDate.toDateString() === new Date().toDateString();
              
              if (daySchedule && daySchedule.isWorking) {
                const startTime = formatTime(daySchedule.startTime);
                const endTime = formatTime(daySchedule.endTime);
                const hours = calculateHours(daySchedule.startTime, daySchedule.endTime);
                
                return (
                  <View style={styles.todayWorkingHours}>
                    <Text style={styles.workingTimeText}>
                      {startTime} - {endTime}
                    </Text>
                    <Text style={styles.hoursCountText}>
                      ({hours} hours)
                    </Text>
                  </View>
                );
              } else {
                return (
                  <Text style={styles.notWorkingToday}>
                    {isToday ? 'Not scheduled to work today' : 'Not scheduled to work this day'}
                  </Text>
                );
              }
            })()}
          </View>
        </Card.Content>
      </Card>

      {/* Location-Based Clock In/Out */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Clock In/Out</Title>
          
          {/* Map View - React Native Maps for mobile, Leaflet for web */}
          <View style={styles.mapContainer}>
            {userLocation && business?.location && (MapView || LeafletMap) ? (
              isWeb && LeafletMap ? (
                <LeafletMap
                  center={[userLocation.lat, userLocation.lng]}
                  zoom={16}
                  style={{ ...styles.map, zIndex: 1 }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {/* Business Location Marker */}
                  <LeafletMarker position={[business.location.lat, business.location.lng]}>
                  </LeafletMarker>
                  
                  {/* 500m Radius Circle around Business */}
                  <LeafletCircle
                    center={[business.location.lat, business.location.lng]}
                    radius={AppConstants.business.defaultClockRadiusMeters}
                    pathOptions={{
                      color: isWithinRange ? "#10B981" : "#EF4444",
                      weight: 2,
                      fillColor: isWithinRange ? "#10B981" : "#EF4444",
                      fillOpacity: 0.1
                    }}
                  />
                  
                  {/* User Location Marker */}
                  <LeafletMarker position={[userLocation.lat, userLocation.lng]}>
                  </LeafletMarker>
                </LeafletMap>
              ) : MapView ? (
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: userLocation.lat,
                    longitude: userLocation.lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  showsUserLocation={true}
                  showsMyLocationButton={false}
                  showsCompass={true}
                  showsScale={true}
                >
                  {/* Business Location Marker */}
                  <Marker
                    coordinate={{
                      latitude: business.location.lat,
                      longitude: business.location.lng,
                    }}
                    title={business.name}
                    description="Business Location"
                    pinColor="#8B5CF6"
                  />
                  
                  {/* 500m Radius Circle around Business */}
                  <Circle
                    center={{
                      latitude: business.location.lat,
                      longitude: business.location.lng,
                    }}
                    radius={AppConstants.business.defaultClockRadiusMeters}
                    strokeColor={isWithinRange ? "#10B981" : "#EF4444"}
                    strokeWidth={2}
                    fillColor={isWithinRange ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)"}
                  />
                  
                  {/* User Location Marker */}
                  <Marker
                    coordinate={{
                      latitude: userLocation.lat,
                      longitude: userLocation.lng,
                    }}
                    title="Your Location"
                    description={isWithinRange ? "Within range" : "Outside range"}
                    pinColor={isWithinRange ? "#10B981" : "#EF4444"}
                  />
                </MapView>
              ) : null
            ) : (
              <View style={styles.mapPlaceholder}>
                {userLocation && business?.location ? (
                  <>
                    <Icon name="map" size={40} color={theme.colors.primary} />
                    <Text style={styles.mapText}>
                      Location-Based Clock In/Out
                    </Text>
                    <Text style={styles.mapSubtext}>
                      Your location: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                    </Text>
                    <Text style={styles.mapSubtext}>
                      Business: {business.name}
                    </Text>
                    <Text style={styles.mapSubtext}>
                      Distance: {Math.round(calculateDistance(
                        userLocation.lat, userLocation.lng,
                        business.location.lat, business.location.lng
                      ))}m from business
                    </Text>
                  </>
                ) : (
                  <>
                    <Icon name="crosshairs-gps" size={40} color={theme.colors.primary} />
                    <Text style={styles.mapText}>
                      Getting your location...
                    </Text>
                    <Text style={styles.mapSubtext}>
                      Please wait while we load location data
                    </Text>
                  </>
                )}
                
                {/* Visual radius indicator */}
                <View style={styles.radiusCircle}>
                  <View style={[
                    styles.innerCircle,
                    userLocation && { backgroundColor: isWithinRange ? '#10B981' : '#EF4444' }
                  ]} />
                </View>
              </View>
            )}

            {userLocation && (
              <View style={styles.locationInfo}>
                <Icon 
                  name={isWithinRange ? "check-circle" : "alert-circle"} 
                  size={20} 
                  color={isWithinRange ? "#10B981" : "#EF4444"} 
                />
                <Text style={[
                  styles.locationText,
                  { color: isWithinRange ? "#10B981" : "#EF4444" }
                ]}>
                  {isWithinRange ? `Within ${AppConstants.business.defaultClockRadiusMeters}m range` : `Outside ${AppConstants.business.defaultClockRadiusMeters}m range`}
                </Text>
              </View>
            )}
          </View>

          {/* Current Clock Status */}
          {clockStatus.clockedInAt && (
            <View style={[
              styles.currentClockStatus,
              !clockStatus.isClocked && styles.clockedOutStatus
            ]}>
              <Icon 
                name={clockStatus.isClocked ? "clock-check" : "clock-outline"} 
                size={20} 
                color={clockStatus.isClocked ? "#10B981" : "#64748B"} 
              />
              <Text style={[
                styles.clockStatusText,
                !clockStatus.isClocked && styles.clockedOutText
              ]}>
                {clockStatus.isClocked 
                  ? `Clocked in at ${new Date(clockStatus.clockedInAt).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}`
                  : `Last clock ${new Date(clockStatus.clockedInAt).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}`
                }
              </Text>
            </View>
          )}

          {/* Clock Action Buttons */}
          <View style={styles.clockActions}>
            <TouchableOpacity
              style={[
                styles.clockButton,
                styles.clockInButton,
                (!isWithinRange || clockStatus.isClocked) && styles.disabledButton
              ]}
              onPress={() => handleClockAction('clock-in')}
              disabled={clockLoading || !isWithinRange || clockStatus.isClocked}
            >
              {clockLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="clock-in" size={24} color="#FFFFFF" />
                  <Text style={styles.clockButtonText}>
                    {clockStatus.isClocked ? 'Already Clocked In' : 'Clock In'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.clockButton,
                styles.clockOutButton,
                (!isWithinRange || false) && styles.disabledButton // Temporarily disable styling for testing
              ]}
              onPress={() => handleClockAction('clock-out')}
              disabled={clockLoading || !isWithinRange || false} // Temporarily disable the isClocked check for testing
            >
              {clockLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="clock-out" size={24} color="#FFFFFF" />
                  <Text style={styles.clockButtonText}>
                    {!clockStatus.isClocked ? 'Not Clocked In' : 'Clock Out'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.checkLocationButton}
            onPress={checkLocation}
          >
            <Icon name="crosshairs-gps" size={20} color={theme.colors.primary} />
            <Text style={styles.checkLocationText}>Check My Location</Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
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
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },

  // Month Navigation
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    textAlign: 'center',
  },
  todayButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  todayButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Monthly Calendar Grid - Apple Calendar Style
  dayNamesHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
    marginBottom: 8,
  },
  dayNameHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  monthlyCalendarGrid: {
    // Remove flexWrap - we'll use proper rows
  },
  calendarWeekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  monthDayCell: {
    flex: 1,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginHorizontal: 1,
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  monthDayNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayCircle: {
    backgroundColor: '#EF4444', // Red circle for today
  },
  selectedCircle: {
    backgroundColor: '#8B5CF6', // Purple circle for selected date
  },
  dayNumberText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  todayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  otherMonthText: {
    color: '#94A3B8',
  },
  shiftIndicators: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shiftDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981', // Green dot for scheduled shifts
    marginHorizontal: 1,
  },

  // Today's Schedule Details
  todayScheduleHeader: {
    alignItems: 'center',
  },
  todayDateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  todayWorkingHours: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workingTimeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  hoursCountText: {
    fontSize: 14,
    color: '#64748B',
  },
  notWorkingToday: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
  },

  // Map and Location
  mapContainer: {
    marginBottom: 20,
  },
  map: {
    height: 250,
    borderRadius: 12,
  },
  mapPlaceholder: {
    height: 250,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  mapText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 8,
  },
  mapSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  radiusCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.7,
  },
  innerCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },

  // Clock Actions
  clockActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  clockButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  clockInButton: {
    backgroundColor: '#10B981',
  },
  clockOutButton: {
    backgroundColor: '#EF4444',
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  clockButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  checkLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B5CF6',
    backgroundColor: '#FFFFFF',
  },
  checkLocationText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
  },

  // Current Clock Status
  currentClockStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  clockStatusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
  clockedOutStatus: {
    backgroundColor: '#F8FAFC',
    borderColor: '#64748B',
  },
  clockedOutText: {
    color: '#64748B',
  },
});

export default ScheduleScreen;