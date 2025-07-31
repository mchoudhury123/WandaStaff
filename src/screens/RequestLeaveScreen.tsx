import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  TextInput,
  useTheme,
  Chip,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc } from 'firebase/firestore';
import { firestore } from '@/services/firebase';
import { NavigationProps, Staff, HolidayRequest } from '@/types';

const RequestLeaveScreen: React.FC<NavigationProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const [user, setUser] = useState<Staff | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Get leave balance from navigation params
  const leaveBalance = route?.params || { remainingDays: 0, allowance: 25, used: 0 };

  useEffect(() => {
    loadUserData();
  }, []);

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

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isSelectedDate = (date: Date) => {
    return selectedDates.some(selectedDate => 
      selectedDate.toDateString() === date.toDateString()
    );
  };

  const isInSelectedRange = (date: Date) => {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  const handleDatePress = (date: Date) => {
    if (isPastDate(date) || !isCurrentMonth(date)) return;

    if (!startDate) {
      // First date selection
      setStartDate(date);
      setEndDate(null);
      setSelectedDates([date]);
    } else if (!endDate) {
      // Second date selection
      if (date < startDate) {
        // If second date is before first, swap them
        setEndDate(startDate);
        setStartDate(date);
        setSelectedDates(getDateRange(date, startDate));
      } else {
        setEndDate(date);
        setSelectedDates(getDateRange(startDate, date));
      }
    } else {
      // Reset selection
      setStartDate(date);
      setEndDate(null);
      setSelectedDates([date]);
    }
  };

  const getDateRange = (start: Date, end: Date): Date[] => {
    const dates = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
  };

  const clearSelection = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedDates([]);
  };

  const calculateWorkdays = (dates: Date[]): number => {
    // Filter out weekends (Saturday = 6, Sunday = 0)
    return dates.filter(date => {
      const day = date.getDay();
      return day !== 0 && day !== 6;
    }).length;
  };

  const checkBalanceAndSubmit = () => {
    if (!user || selectedDates.length === 0 || !reason.trim()) {
      Alert.alert('Error', 'Please select dates and provide a reason for your leave request.');
      return;
    }

    if (!startDate || !endDate) {
      Alert.alert('Error', 'Please select valid start and end dates.');
      return;
    }

    const workdays = calculateWorkdays(selectedDates);
    
    // Check if requesting more days than available
    if (workdays > leaveBalance.remainingDays) {
      Alert.alert(
        'Insufficient Leave Balance',
        `You are requesting ${workdays} working days but only have ${leaveBalance.remainingDays} days remaining.\n\nThis request will likely be denied due to insufficient balance.`,
        [
          { 
            text: 'Edit Dates', 
            style: 'cancel',
            onPress: () => {
              // Do nothing, let user edit dates
            }
          },
          { 
            text: 'Submit Anyway', 
            style: 'destructive',
            onPress: () => submitRequest()
          }
        ]
      );
    } else {
      // Sufficient balance, submit directly
      submitRequest();
    }
  };

  const submitRequest = async () => {
    setSubmitting(true);
    try {
      const workdays = calculateWorkdays(selectedDates);
      
      const holidayRequest: Omit<HolidayRequest, 'id'> = {
        staffId: user!.id,
        staffName: `${user!.firstName} ${user!.lastName}`,
        startDate: startDate!.toISOString().split('T')[0],
        endDate: endDate!.toISOString().split('T')[0],
        days: workdays,
        reason: reason.trim(),
        status: 'pending',
        requestedAt: new Date().toISOString()
      };

      await addDoc(collection(firestore, 'holidayRequests'), holidayRequest);
      
      // Show confirmation popup
      Alert.alert(
        'Holiday Request Submitted',
        `Your annual leave request for ${workdays} working days from ${startDate!.toLocaleDateString()} to ${endDate!.toLocaleDateString()} has been successfully submitted and is now pending approval.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to Annual Leave screen
              navigation?.goBack();
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', 'Failed to submit holiday request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  const monthDays = getMonthDays();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const workdays = calculateWorkdays(selectedDates);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Selection Summary */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Selection Summary</Title>
          
          {selectedDates.length > 0 ? (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Dates Selected:</Text>
                <Text style={styles.summaryValue}>
                  {startDate?.toLocaleDateString()} - {endDate?.toLocaleDateString()}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Days:</Text>
                <Text style={styles.summaryValue}>{selectedDates.length} days</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Working Days:</Text>
                <Text style={[styles.summaryValue, { color: '#10B981', fontWeight: 'bold' }]}>
                  {workdays} days
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Days Remaining:</Text>
                <Text style={[styles.summaryValue, { 
                  color: workdays > leaveBalance.remainingDays ? '#EF4444' : '#10B981',
                  fontWeight: 'bold' 
                }]}>
                  {leaveBalance.remainingDays} days
                </Text>
              </View>
              
              {workdays > leaveBalance.remainingDays && (
                <View style={styles.warningContainer}>
                  <Icon name="alert" size={16} color="#EF4444" />
                  <Text style={styles.warningText}>
                    Requesting more days than available. Request may be denied.
                  </Text>
                </View>
              )}
              
              <Button
                mode="outlined"
                onPress={clearSelection}
                style={styles.clearButton}
                compact
              >
                Clear Selection
              </Button>
            </View>
          ) : (
            <View style={styles.emptySelection}>
              <Icon name="calendar-remove" size={32} color="#94A3B8" />
              <Text style={styles.emptyText}>Select your leave dates below</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Calendar */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => navigateMonth('prev')}>
              <Icon name="chevron-left" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            
            <Text style={styles.monthTitle}>
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            
            <TouchableOpacity onPress={() => navigateMonth('next')}>
              <Icon name="chevron-right" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Day Names Header */}
          <View style={styles.dayNamesHeader}>
            {dayNames.map((dayName, index) => (
              <Text key={index} style={styles.dayNameHeader}>
                {dayName}
              </Text>
            ))}
          </View>
          
          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {Array.from({ length: Math.ceil(monthDays.length / 7) }, (_, weekIndex) => (
              <View key={weekIndex} style={styles.calendarWeekRow}>
                {monthDays.slice(weekIndex * 7, weekIndex * 7 + 7).map((date, dayIndex) => {
                  const today = isToday(date);
                  const currentMonthDay = isCurrentMonth(date);
                  const pastDate = isPastDate(date);
                  const selected = isSelectedDate(date);
                  const inRange = isInSelectedRange(date);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  
                  return (
                    <TouchableOpacity 
                      key={dayIndex} 
                      style={[
                        styles.calendarDay,
                        !currentMonthDay && styles.otherMonthDay,
                        pastDate && styles.pastDay,
                      ]}
                      onPress={() => handleDatePress(date)}
                      disabled={pastDate || !currentMonthDay}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.dayNumber,
                        today && styles.todayCircle,
                        selected && styles.selectedCircle,
                        inRange && !selected && styles.rangeCircle,
                      ]}>
                        <Text style={[
                          styles.dayNumberText,
                          today && styles.todayText,
                          selected && styles.selectedText,
                          inRange && !selected && styles.rangeText,
                          !currentMonthDay && styles.otherMonthText,
                          pastDate && styles.pastText,
                          isWeekend && currentMonthDay && !pastDate && styles.weekendText,
                        ]}>
                          {date.getDate()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>Selected</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#8B5CF620' }]} />
              <Text style={styles.legendText}>In Range</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>Today</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Reason Input */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Reason for Leave</Title>
          
          <TextInput
            mode="outlined"
            label="Reason"
            value={reason}
            onChangeText={setReason}
            placeholder="e.g., Annual holiday, Personal matters, Family visit..."
            multiline
            numberOfLines={3}
            style={styles.reasonInput}
          />
          
          <View style={styles.reasonChips}>
            <Text style={styles.chipLabel}>Quick reasons:</Text>
            <View style={styles.chipRow}>
              {['Annual holiday', 'Personal matters', 'Family visit', 'Medical'].map((quickReason) => (
                <Chip
                  key={quickReason}
                  mode="outlined"
                  onPress={() => setReason(quickReason)}
                  style={styles.reasonChip}
                >
                  {quickReason}
                </Chip>
              ))}
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <Button
          mode="contained"
          onPress={checkBalanceAndSubmit}
          loading={submitting}
          disabled={submitting || selectedDates.length === 0 || !reason.trim()}
          style={[
            styles.submitButton,
            workdays > leaveBalance.remainingDays && styles.warningButton
          ]}
          icon="send"
        >
          {workdays > leaveBalance.remainingDays 
            ? `Submit Request (${workdays - leaveBalance.remainingDays} days over limit)`
            : 'Submit Leave Request'
          }
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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

  // Summary
  summaryContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#064E3B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#064E3B',
  },
  clearButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  warningText: {
    fontSize: 12,
    color: '#EF4444',
    marginLeft: 6,
    flex: 1,
  },
  emptySelection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },

  // Calendar
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
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
  calendarGrid: {
    marginBottom: 16,
  },
  calendarWeekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  calendarDay: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  pastDay: {
    opacity: 0.5,
  },
  dayNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayCircle: {
    backgroundColor: '#EF4444',
  },
  selectedCircle: {
    backgroundColor: '#10B981',
  },
  rangeCircle: {
    backgroundColor: '#8B5CF620',
  },
  dayNumberText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  todayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  rangeText: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  otherMonthText: {
    color: '#94A3B8',
  },
  pastText: {
    color: '#94A3B8',
  },
  weekendText: {
    color: '#EF4444',
  },

  // Legend
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#64748B',
  },

  // Reason
  reasonInput: {
    marginBottom: 16,
  },
  reasonChips: {
    marginTop: 8,
  },
  chipLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonChip: {
    marginBottom: 8,
  },

  // Submit
  submitContainer: {
    margin: 16,
    marginBottom: 32,
  },
  submitButton: {
    paddingVertical: 8,
  },
  warningButton: {
    backgroundColor: '#F59E0B',
  },
});

export default RequestLeaveScreen;