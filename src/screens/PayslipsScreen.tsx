import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  useTheme,
  List,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuth } from '@/components/common/AuthContext';
import { NavigationProps, Payslip } from '@/types';

const PayslipsScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const { user } = useAuth();
  const theme = useTheme();
  
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPayslips = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // TODO: Implement payslips service
      // Mock data for now
      const mockPayslips: Payslip[] = [
        {
          id: '1',
          staffId: user.id,
          month: '2024-01',
          basicSalary: 3000,
          allowances: 500,
          commission: 200,
          bonus: 100,
          deductions: 50,
          totalGross: 3800,
          totalNet: 3750,
        },
        {
          id: '2',
          staffId: user.id,
          month: '2023-12',
          basicSalary: 3000,
          allowances: 500,
          commission: 150,
          bonus: 0,
          deductions: 50,
          totalGross: 3650,
          totalNet: 3600,
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

  useEffect(() => {
    loadPayslips();
  }, [user]);

  const formatCurrency = (amount: number) => {
    return `QAR ${amount.toLocaleString()}`;
  };

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  const handleDownloadPayslip = (payslip: Payslip) => {
    Alert.alert(
      'Download Payslip',
      `Download payslip for ${formatMonth(payslip.month)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: () => {
            // TODO: Implement PDF download
            Alert.alert('Coming Soon', 'PDF download will be available soon');
          },
        },
      ]
    );
  };

  if (!user) {
    return null;
  }

  const latestPayslip = payslips[0];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadPayslips} />
      }
    >
      {/* Current Month Summary */}
      {latestPayslip && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Latest Payslip - {formatMonth(latestPayslip.month)}</Title>
            
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Gross Salary</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(latestPayslip.totalGross)}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Deductions</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.error }]}>
                  -{formatCurrency(latestPayslip.deductions)}
                </Text>
              </View>
              
              <Divider style={styles.divider} />
              
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, styles.totalLabel]}>Net Salary</Text>
                <Text style={[styles.summaryValue, styles.totalValue, { color: theme.colors.primary }]}>
                  {formatCurrency(latestPayslip.totalNet)}
                </Text>
              </View>
            </View>

            <Button
              mode="outlined"
              onPress={() => handleDownloadPayslip(latestPayslip)}
              style={styles.downloadButton}
              icon="download"
            >
              Download PDF
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Salary Breakdown */}
      {latestPayslip && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Salary Breakdown</Title>
            
            <List.Item
              title="Basic Salary"
              right={() => <Text style={styles.amountText}>{formatCurrency(latestPayslip.basicSalary)}</Text>}
              left={() => <List.Icon icon="cash" />}
            />
            <Divider />
            
            <List.Item
              title="Allowances"
              right={() => <Text style={styles.amountText}>{formatCurrency(latestPayslip.allowances)}</Text>}
              left={() => <List.Icon icon="plus-circle-outline" />}
            />
            <Divider />
            
            <List.Item
              title="Commission"
              right={() => <Text style={styles.amountText}>{formatCurrency(latestPayslip.commission)}</Text>}
              left={() => <List.Icon icon="chart-line" />}
            />
            <Divider />
            
            <List.Item
              title="Bonus"
              right={() => <Text style={styles.amountText}>{formatCurrency(latestPayslip.bonus)}</Text>}
              left={() => <List.Icon icon="gift" />}
            />
            <Divider />
            
            <List.Item
              title="Deductions"
              right={() => <Text style={[styles.amountText, { color: theme.colors.error }]}>-{formatCurrency(latestPayslip.deductions)}</Text>}
              left={() => <List.Icon icon="minus-circle-outline" color={theme.colors.error} />}
            />
          </Card.Content>
        </Card>
      )}

      {/* Payslip History */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Payslip History</Title>
          {payslips.length > 0 ? (
            payslips.map((payslip, index) => (
              <View key={payslip.id}>
                <List.Item
                  title={formatMonth(payslip.month)}
                  description={`Net: ${formatCurrency(payslip.totalNet)}`}
                  left={() => <List.Icon icon="file-document" />}
                  right={() => (
                    <Button
                      mode="text"
                      onPress={() => handleDownloadPayslip(payslip)}
                      compact
                    >
                      Download
                    </Button>
                  )}
                />
                {index < payslips.length - 1 && <Divider />}
              </View>
            ))
          ) : (
            <Text style={styles.noData}>No payslips available</Text>
          )}
        </Card.Content>
      </Card>

      {/* Salary Info */}
      {user.salary && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Salary Information</Title>
            <Paragraph style={styles.description}>
              Your current salary structure
            </Paragraph>
            
            <List.Item
              title="Basic Salary"
              right={() => <Text style={styles.amountText}>{formatCurrency(user.salary?.basicSalary || 0)}</Text>}
            />
            <Divider />
            
            <List.Item
              title="Housing Allowance"
              right={() => <Text style={styles.amountText}>{formatCurrency(user.salary?.housing || 0)}</Text>}
            />
            <Divider />
            
            <List.Item
              title="Transportation"
              right={() => <Text style={styles.amountText}>{formatCurrency(user.salary?.transportation || 0)}</Text>}
            />
            <Divider />
            
            <List.Item
              title="Other Allowances"
              right={() => <Text style={styles.amountText}>{formatCurrency(user.salary?.allowance || 0)}</Text>}
            />
          </Card.Content>
        </Card>
      )}

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
  summaryContainer: {
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 8,
  },
  downloadButton: {
    marginTop: 16,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    opacity: 0.7,
    marginBottom: 8,
  },
  noData: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 16,
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

export default PayslipsScreen;