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
  ProgressBar,
  useTheme,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '@/services/firebase';
import { NavigationProps, Staff, CommissionStructure } from '@/types';

interface CommissionPlan {
  id: string;
  businessId: string;
  name: string;
  commissionStructure: CommissionStructure;
  isActive: boolean;
}

interface SalesData {
  currentMonth: number;
  currentTarget: number;
  ytdSales: number;
  ytdTarget: number;
  commission: number;
}

const CommissionScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const theme = useTheme();
  const [user, setUser] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(false);
  const [commissionPlan, setCommissionPlan] = useState<CommissionPlan | null>(null);
  const [salesData, setSalesData] = useState<SalesData>({
    currentMonth: 0,
    currentTarget: 0,
    ytdSales: 0,
    ytdTarget: 0,
    commission: 0
  });

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      loadCommissionData();
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

  const loadCommissionData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get commission plans for this business
      const plansQuery = query(
        collection(firestore, 'commissionPlans'),
        where('businessId', '==', user.businessId),
        where('isActive', '==', true)
      );
      const plansSnapshot = await getDocs(plansQuery);
      
      if (!plansSnapshot.empty) {
        const planData = plansSnapshot.docs[0].data() as Omit<CommissionPlan, 'id'>;
        setCommissionPlan({
          id: plansSnapshot.docs[0].id,
          ...planData
        });
      } else {
        // Create mock commission plan if none exists
        const mockPlan: CommissionPlan = {
          id: 'mock-plan',
          businessId: user.businessId,
          name: 'Standard Commission Plan',
          commissionStructure: {
            commissionBrackets: [
              { minQAR: 0, maxQAR: 5000, ratePercent: 5 },
              { minQAR: 5001, maxQAR: 10000, ratePercent: 7 },
              { minQAR: 10001, maxQAR: 20000, ratePercent: 10 },
              { minQAR: 20001, maxQAR: 999999, ratePercent: 15 }
            ],
            bonusStructure: {
              salesPercent: 120, // Bonus at 120% of target
              salaryPercent: 10   // 10% of salary as bonus
            }
          },
          isActive: true
        };
        setCommissionPlan(mockPlan);
      }

      // Mock sales data - in real app this would come from sales records
      const mockSalesData: SalesData = {
        currentMonth: 8500,
        currentTarget: 12000,
        ytdSales: 95000,
        ytdTarget: 120000,
        commission: 1200
      };
      setSalesData(mockSalesData);

    } catch (error) {
      console.error('Error loading commission data:', error);
      Alert.alert('Error', 'Failed to load commission data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `QAR ${amount.toLocaleString()}`;
  };

  const calculateCommission = (sales: number, brackets: any[]) => {
    let commission = 0;
    let remainingSales = sales;

    for (const bracket of brackets) {
      if (remainingSales <= 0) break;
      
      const bracketRange = bracket.maxQAR - bracket.minQAR;
      const salesInBracket = Math.min(remainingSales, bracketRange);
      commission += (salesInBracket * bracket.ratePercent) / 100;
      remainingSales -= salesInBracket;
    }

    return commission;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return '#10B981';
    if (progress >= 75) return '#F59E0B';
    return '#8B5CF6';
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const monthlyProgress = (salesData.currentMonth / salesData.currentTarget) * 100;
  const ytdProgress = (salesData.ytdSales / salesData.ytdTarget) * 100;

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadCommissionData} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Monthly Performance */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>This Month's Performance</Title>
            
            <View style={styles.performanceContainer}>
              <View style={styles.performanceRow}>
                <Text style={styles.performanceLabel}>Sales</Text>
                <Text style={styles.performanceValue}>{formatCurrency(salesData.currentMonth)}</Text>
              </View>
              
              <View style={styles.performanceRow}>
                <Text style={styles.performanceLabel}>Target</Text>
                <Text style={styles.performanceValue}>{formatCurrency(salesData.currentTarget)}</Text>
              </View>
              
              <ProgressBar
                progress={monthlyProgress / 100}
                color={getProgressColor(monthlyProgress)}
                style={styles.progressBar}
              />
              
              <View style={styles.progressInfo}>
                <Text style={styles.progressText}>{monthlyProgress.toFixed(1)}% of target</Text>
                <Text style={styles.remainingText}>
                  {formatCurrency(Math.max(0, salesData.currentTarget - salesData.currentMonth))} remaining
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Commission Earned */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Commission This Month</Title>
            
            <View style={styles.commissionContainer}>
              <Text style={styles.commissionAmount}>{formatCurrency(salesData.commission)}</Text>
              <Text style={styles.commissionLabel}>Earned so far</Text>
              
              {commissionPlan && (
                <View style={styles.projectedContainer}>
                  <Text style={styles.projectedLabel}>Projected commission if target met:</Text>
                  <Text style={styles.projectedAmount}>
                    {formatCurrency(calculateCommission(salesData.currentTarget, commissionPlan.commissionStructure.commissionBrackets))}
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* YTD Performance */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Year to Date</Title>
            
            <View style={styles.performanceContainer}>
              <View style={styles.performanceRow}>
                <Text style={styles.performanceLabel}>YTD Sales</Text>
                <Text style={styles.performanceValue}>{formatCurrency(salesData.ytdSales)}</Text>
              </View>
              
              <View style={styles.performanceRow}>
                <Text style={styles.performanceLabel}>YTD Target</Text>
                <Text style={styles.performanceValue}>{formatCurrency(salesData.ytdTarget)}</Text>
              </View>
              
              <ProgressBar
                progress={ytdProgress / 100}
                color={getProgressColor(ytdProgress)}
                style={styles.progressBar}
              />
              
              <View style={styles.progressInfo}>
                <Text style={styles.progressText}>{ytdProgress.toFixed(1)}% of annual target</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Commission Structure */}
        {commissionPlan && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Commission Structure</Title>
              <Text style={styles.planName}>{commissionPlan.name}</Text>
              
              {commissionPlan.commissionStructure.commissionBrackets.map((bracket, index) => (
                <View key={index} style={styles.bracketContainer}>
                  <View style={styles.bracketInfo}>
                    <Text style={styles.bracketRange}>
                      {formatCurrency(bracket.minQAR)} - {bracket.maxQAR === 999999 ? '∞' : formatCurrency(bracket.maxQAR)}
                    </Text>
                    <Chip 
                      style={styles.rateChip}
                      textStyle={styles.rateText}
                    >
                      {bracket.ratePercent}%
                    </Chip>
                  </View>
                </View>
              ))}
              
              <View style={styles.bonusInfo}>
                <Text style={styles.bonusTitle}>Bonus Structure</Text>
                <Text style={styles.bonusText}>
                  • {commissionPlan.commissionStructure.bonusStructure.salaryPercent}% salary bonus at {commissionPlan.commissionStructure.bonusStructure.salesPercent}% of target
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Tips */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.tipsContainer}>
              <Icon name="lightbulb" size={24} color="#F59E0B" />
              <View style={styles.tipsText}>
                <Text style={styles.tipsTitle}>Tips to Maximize Commission</Text>
                <Text style={styles.tipsDescription}>
                  • Focus on upselling services to reach higher commission brackets{'\n'}
                  • Build relationships with clients for repeat business{'\n'}
                  • Meet monthly targets to qualify for bonus payments
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

  // Performance
  performanceContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  performanceLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginVertical: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  remainingText: {
    fontSize: 12,
    color: '#64748B',
  },

  // Commission
  commissionContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
  },
  commissionAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  commissionLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  projectedContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  projectedLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  projectedAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#059669',
  },

  // Commission Structure
  planName: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
    marginBottom: 16,
  },
  bracketContainer: {
    marginBottom: 12,
  },
  bracketInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  bracketRange: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  rateChip: {
    backgroundColor: '#8B5CF6',
  },
  rateText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bonusInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  bonusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  bonusText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },

  // Tips
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  tipsText: {
    marginLeft: 12,
    flex: 1,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  tipsDescription: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
});

export default CommissionScreen;