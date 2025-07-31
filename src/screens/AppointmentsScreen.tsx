import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  useTheme,
  Chip,
  List,
  Divider,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { NavigationProps, Appointment, Rota, ScheduleDay } from '@/types';

const AppointmentsScreen: React.FC<NavigationProps> = () => {
  const theme = useTheme();
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const staffData = await AsyncStorage.getItem('staff');
      if (staffData) {
        setUser(JSON.parse(staffData));
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const loadAppointmentData = async () => {
    setLoading(true);
    // Simulate loading appointments
    setTimeout(() => {
      setAppointments([
        {
          id: '1',
          businessId: 'business1',
          staffId: user?.id || '',
          clientId: 'client1',
          serviceId: 'service1',
          date: new Date().toISOString().split('T')[0],
          time: '09:00',
          duration: 60,
          status: 'scheduled',
          clientName: 'Sarah Johnson',
          serviceName: 'Hair Cut & Style',
        },
        {
          id: '2',
          businessId: 'business1',
          staffId: user?.id || '',
          clientId: 'client2',
          serviceId: 'service2',
          date: new Date().toISOString().split('T')[0],
          time: '11:30',
          duration: 90,
          status: 'scheduled',
          clientName: 'Emma Davis',
          serviceName: 'Color Treatment',
        },
      ]);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    if (user) {
      loadAppointmentData();
    }
  }, [user]);

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getWeekDays = () => {
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date);
    }
    return weekDays;
  };

  const getAppointmentsForDate = (date: Date): Appointment[] => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.date === dateStr);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const weekDays = getWeekDays();
  const todayAppointments = getAppointmentsForDate(new Date());

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadAppointmentData} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* View Mode Toggle */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.toggleContainer}>
            <Button
              mode={viewMode === 'day' ? 'contained' : 'outlined'}
              onPress={() => setViewMode('day')}
              style={styles.toggleButton}
              compact
            >
              Today
            </Button>
            <Button
              mode={viewMode === 'week' ? 'contained' : 'outlined'}
              onPress={() => setViewMode('week')}
              style={styles.toggleButton}
              compact
            >
              This Week
            </Button>
          </View>
        </Card.Content>
      </Card>

      {viewMode === 'day' ? (
        /* Today's Appointments */
        <Card style={styles.card}>
          <Card.Content>
            <Title>Today's Appointments</Title>
            {todayAppointments.length > 0 ? (
              todayAppointments.map((appointment, index) => (
                <View key={index}>
                  <List.Item
                    title={appointment.clientName || 'Unknown Client'}
                    description={appointment.serviceName || 'Service'}
                    left={() => (
                      <View style={styles.timeContainer}>
                        <Text style={styles.appointmentTime}>
                          {formatTime(appointment.time)}
                        </Text>
                      </View>
                    )}
                    right={() => (
                      <View style={styles.appointmentActions}>
                        <Chip
                          style={[styles.statusChip, { backgroundColor: theme.colors.primary }]}
                          textStyle={{ color: 'white', fontSize: 10 }}
                        >
                          {appointment.duration}min
                        </Chip>
                        <Text style={styles.appointmentStatus}>
                          {appointment.status}
                        </Text>
                      </View>
                    )}
                  />
                  {appointment.notes && (
                    <Paragraph style={styles.appointmentNotes}>
                      Notes: {appointment.notes}
                    </Paragraph>
                  )}
                  {index < todayAppointments.length - 1 && <Divider />}
                </View>
              ))
            ) : (
              <Text style={styles.noAppointments}>No appointments scheduled for today</Text>
            )}
          </Card.Content>
        </Card>
      ) : (
        /* Week View */
        <Card style={styles.card}>
          <Card.Content>
            <Title>This Week's Appointments</Title>
            {weekDays.map((date, index) => {
              const dayAppointments = getAppointmentsForDate(date);
              
              return (
                <View key={index} style={styles.weekDayContainer}>
                  <View style={styles.weekDayHeader}>
                    <Text style={[
                      styles.weekDayName,
                      isToday(date) && { color: theme.colors.primary, fontWeight: 'bold' }
                    ]}>
                      {date.toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Text>
                    {isToday(date) && (
                      <Chip style={styles.todayChip} textStyle={{ fontSize: 10 }}>
                        TODAY
                      </Chip>
                    )}
                  </View>
                  
                  {dayAppointments.length > 0 ? (
                    <View style={styles.dayAppointments}>
                      {dayAppointments.slice(0, 3).map((apt, aptIndex) => (
                        <Text key={aptIndex} style={styles.weekAppointment}>
                          {formatTime(apt.time)} - {apt.clientName || 'Client'} ({apt.serviceName})
                        </Text>
                      ))}
                      {dayAppointments.length > 3 && (
                        <Text style={styles.moreAppointments}>
                          +{dayAppointments.length - 3} more
                        </Text>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.dayOff}>No appointments</Text>
                  )}
                  
                  {index < weekDays.length - 1 && <Divider style={styles.weekDivider} />}
                </View>
              );
            })}
          </Card.Content>
        </Card>
      )}
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
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  toggleButton: {
    marginHorizontal: 8,
    minWidth: 80,
  },
  timeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  appointmentTime: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  appointmentActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  statusChip: {
    marginBottom: 4,
  },
  appointmentStatus: {
    fontSize: 12,
    opacity: 0.7,
    textTransform: 'capitalize',
  },
  appointmentNotes: {
    fontSize: 12,
    opacity: 0.7,
    fontStyle: 'italic',
    marginLeft: 72,
    marginTop: -8,
    marginBottom: 8,
  },
  noAppointments: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 16,
  },
  weekDayContainer: {
    marginVertical: 8,
  },
  weekDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weekDayName: {
    fontSize: 16,
    fontWeight: '500',
  },
  todayChip: {
    height: 24,
  },
  dayAppointments: {
    marginLeft: 16,
  },
  weekAppointment: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 2,
  },
  moreAppointments: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  dayOff: {
    fontSize: 14,
    opacity: 0.6,
    marginLeft: 16,
  },
  weekDivider: {
    marginTop: 16,
  },
});

export default AppointmentsScreen;