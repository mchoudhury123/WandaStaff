import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from './AuthContext';
import { FirestoreService } from './FirestoreService';
import { Appointment, HolidayRequest } from './types';

export const DashboardExample: React.FC = () => {
  const { staffMember, signOut } = useAuth();
  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [holidayRequests, setHolidayRequests] = useState<HolidayRequest[]>([]);

  useEffect(() => {
    if (!staffMember) return;

    // Subscribe to today's appointments
    const unsubscribeToday = FirestoreService.subscribeToTodaysAppointments(
      staffMember.staffId,
      setTodaysAppointments
    );

    // Subscribe to upcoming appointments
    const unsubscribeUpcoming = FirestoreService.subscribeToUpcomingAppointments(
      staffMember.staffId,
      setUpcomingAppointments
    );

    // Subscribe to holiday requests
    const unsubscribeHolidays = FirestoreService.subscribeToHolidayRequests(
      staffMember.staffId,
      setHolidayRequests
    );

    return () => {
      unsubscribeToday();
      unsubscribeUpcoming();
      unsubscribeHolidays();
    };
  }, [staffMember]);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', onPress: signOut },
      ]
    );
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!staffMember) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {staffMember.name}</Text>
        <Text style={styles.roleText}>{staffMember.role} • {staffMember.location}</Text>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Schedule */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        {todaysAppointments.length === 0 ? (
          <Text style={styles.emptyText}>No appointments today</Text>
        ) : (
          todaysAppointments.map((appointment) => (
            <View key={appointment.id} style={styles.appointmentCard}>
              <Text style={styles.appointmentTime}>
                {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
              </Text>
              <Text style={styles.appointmentClient}>{appointment.clientName}</Text>
              <Text style={styles.appointmentService}>{appointment.service}</Text>
              <Text style={[styles.appointmentStatus, { color: getStatusColor(appointment.status) }]}>
                {appointment.status.toUpperCase()}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Upcoming Appointments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming This Week</Text>
        {upcomingAppointments.length === 0 ? (
          <Text style={styles.emptyText}>No upcoming appointments</Text>
        ) : (
          upcomingAppointments.slice(0, 5).map((appointment) => (
            <View key={appointment.id} style={styles.appointmentCard}>
              <Text style={styles.appointmentDate}>{formatDate(appointment.startTime)}</Text>
              <Text style={styles.appointmentTime}>
                {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
              </Text>
              <Text style={styles.appointmentClient}>{appointment.clientName}</Text>
              <Text style={styles.appointmentService}>{appointment.service}</Text>
            </View>
          ))
        )}
      </View>

      {/* Holiday Requests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Holiday Requests</Text>
        {holidayRequests.length === 0 ? (
          <Text style={styles.emptyText}>No holiday requests</Text>
        ) : (
          holidayRequests.slice(0, 3).map((request) => (
            <View key={request.id} style={styles.holidayCard}>
              <Text style={styles.holidayDates}>
                {formatDate(request.startDate)} - {formatDate(request.endDate)}
              </Text>
              <Text style={styles.holidayReason}>{request.reason}</Text>
              <Text style={[styles.holidayStatus, { color: getHolidayStatusColor(request.status) }]}>
                {request.status.toUpperCase()}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'scheduled': return '#007AFF';
    case 'completed': return '#34C759';
    case 'cancelled': return '#FF3B30';
    case 'no-show': return '#FF9500';
    default: return '#666';
  }
};

const getHolidayStatusColor = (status: string): string => {
  switch (status) {
    case 'approved': return '#34C759';
    case 'rejected': return '#FF3B30';
    case 'pending': return '#FF9500';
    default: return '#666';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  roleText: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  signOutButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    padding: 8,
  },
  signOutText: {
    color: '#007AFF',
    fontSize: 16,
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  appointmentCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  appointmentTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  appointmentClient: {
    fontSize: 16,
    color: '#333',
    marginTop: 4,
  },
  appointmentService: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  appointmentStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  appointmentDate: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  holidayCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  holidayDates: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  holidayReason: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  holidayStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
});