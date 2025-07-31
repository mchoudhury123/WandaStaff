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
  List,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProps, Staff, Payslip } from '@/types';

const PayslipsScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const theme = useTheme();
  const [user, setUser] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(false);
  const [payslips, setPayslips] = useState<Payslip[]>([]);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      loadPayslips();
    }
  }, [user]);

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

  const loadPayslips = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Mock payslips data for now
      const mockPayslips: Payslip[] = [
        {
          id: '1',
          staffId: user.id,
          month: '2024-03',
          basicSalary: 2500,
          allowances: 300,
          commission: 450,
          bonus: 100,
          deductions: 150,
          totalGross: 3350,
          totalNet: 3200,
        },
        {
          id: '2',
          staffId: user.id,
          month: '2024-02',
          basicSalary: 2500,
          allowances: 300,
          commission: 380,
          bonus: 0,
          deductions: 150,
          totalGross: 3180,
          totalNet: 3030,
        },
        {
          id: '3',
          staffId: user.id,
          month: '2024-01',
          basicSalary: 2500,
          allowances: 300,
          commission: 520,
          bonus: 200,
          deductions: 150,
          totalGross: 3520,
          totalNet: 3370,
        },
      ];

      setPayslips(mockPayslips);
    } catch (error) {
      console.error('Error loading payslips:', error);
      Alert.alert('Error', 'Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `QAR ${amount.toFixed(2)}`;
  };

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const downloadPayslip = (payslip: Payslip) => {
    Alert.alert(
      'Download Payslip',
      `This would download the payslip for ${formatMonth(payslip.month)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: () => console.log('Downloading payslip...') }
      ]
    );
  };

  const viewPayslipDetails = (payslip: Payslip) => {
    Alert.alert(
      `Payslip - ${formatMonth(payslip.month)}`,
      `Basic Salary: ${formatCurrency(payslip.basicSalary)}\n` +
      `Allowances: ${formatCurrency(payslip.allowances)}\n` +
      `Commission: ${formatCurrency(payslip.commission)}\n` +
      `Bonus: ${formatCurrency(payslip.bonus)}\n` +
      `Deductions: ${formatCurrency(payslip.deductions)}\n\n` +
      `Gross Total: ${formatCurrency(payslip.totalGross)}\n` +
      `Net Pay: ${formatCurrency(payslip.totalNet)}`,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'Download PDF', onPress: () => downloadPayslip(payslip) }
      ]
    );
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
          <RefreshControl refreshing={loading} onRefresh={loadPayslips} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Current Month Summary */}
        {payslips.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Latest Payslip</Title>
              
              <View style={styles.currentPayslip}>
                <Text style={styles.currentMonth}>{formatMonth(payslips[0].month)}</Text>
                <Text style={styles.currentAmount}>{formatCurrency(payslips[0].totalNet)}</Text>
                <Text style={styles.currentLabel}>Net Pay</Text>
                
                <Button
                  mode="contained"
                  onPress={() => viewPayslipDetails(payslips[0])}
                  style={styles.viewButton}
                  icon="eye"
                >
                  View Details
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Payslips History */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Payslip History</Title>
            
            {payslips.length > 0 ? (
              payslips.map((payslip, index) => (
                <List.Item
                  key={payslip.id}
                  title={formatMonth(payslip.month)}
                  description={`Net Pay: ${formatCurrency(payslip.totalNet)}`}
                  left={() => (
                    <View style={styles.payslipIcon}>
                      <Icon name="file-document" size={24} color="#8B5CF6" />
                    </View>
                  )}
                  right={() => (
                    <View style={styles.payslipActions}>
                      <Text style={styles.grossAmount}>{formatCurrency(payslip.totalGross)}</Text>
                      <Icon name="chevron-right" size={24} color="#9CA3AF" />
                    </View>
                  )}
                  onPress={() => viewPayslipDetails(payslip)}
                  style={[styles.payslipItem, index === 0 && styles.latestPayslip]}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="file-document-outline" size={48} color="#94A3B8" />
                <Text style={styles.emptyText}>No payslips available</Text>
                <Text style={styles.emptySubtext}>Your payslips will appear here once generated</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Notice */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.noticeContainer}>
              <Icon name="information" size={24} color="#3B82F6" />
              <View style={styles.noticeText}>
                <Text style={styles.noticeTitle}>Payslips Information</Text>
                <Text style={styles.noticeDescription}>
                  Payslips are generated monthly and available for download in PDF format. 
                  Contact HR if you have any questions about your payslip.
                </Text>
              </View>
            </View>
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

  // Current Payslip
  currentPayslip: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  currentMonth: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  currentAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  currentLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  viewButton: {
    marginTop: 8,
  },

  // Payslip List
  payslipItem: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderRadius: 8,
    paddingVertical: 8,
  },
  latestPayslip: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  payslipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF620',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  payslipActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  grossAmount: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
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

  // Notice
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  noticeText: {
    marginLeft: 12,
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  noticeDescription: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
  },
});

export default PayslipsScreen;