import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme, ActivityIndicator, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '@/components/common/AuthContext';
import { RootStackParamList, BottomTabParamList } from '@/types';

import SplashScreen from '@/screens/SplashScreen';
import LoginScreen from '@/screens/LoginScreen';
import DashboardScreen from '@/screens/DashboardScreen';
import ScheduleScreen from '@/screens/ScheduleScreen';
import AppointmentsScreen from '@/screens/AppointmentsScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import AnnualLeaveScreen from '@/screens/AnnualLeaveScreen';
import RequestLeaveScreen from '@/screens/RequestLeaveScreen';
import PayslipsScreen from '@/screens/PayslipsScreen';
import CommissionScreen from '@/screens/CommissionScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

const MainStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={BottomTabNavigator} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AnnualLeave" 
        component={AnnualLeaveScreen}
        options={{
          title: 'Annual Leave',
          headerStyle: {
            backgroundColor: '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          },
          headerTintColor: '#1E293B',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
        }}
      />
      <Stack.Screen 
        name="RequestLeave" 
        component={RequestLeaveScreen}
        options={{
          title: 'Request Leave',
          headerStyle: {
            backgroundColor: '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          },
          headerTintColor: '#1E293B',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
        }}
      />
      <Stack.Screen 
        name="Payslips" 
        component={PayslipsScreen}
        options={{
          title: 'Payslips',
          headerStyle: {
            backgroundColor: '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          },
          headerTintColor: '#1E293B',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
        }}
      />
      <Stack.Screen 
        name="Commission" 
        component={CommissionScreen}
        options={{
          title: 'Commission',
          headerStyle: {
            backgroundColor: '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          },
          headerTintColor: '#1E293B',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
        }}
      />
    </Stack.Navigator>
  );
};

const BottomTabNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Schedule':
              iconName = focused ? 'calendar-clock' : 'calendar-clock-outline';
              break;
            case 'Appointments':
              iconName = focused ? 'calendar-check' : 'calendar-check-outline';
              break;
            case 'Profile':
              iconName = focused ? 'account-circle' : 'account-circle-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }

          return (
            <View style={styles.tabIconContainer}>
              <Icon name={iconName} size={28} color={color} />
              {focused && <View style={[styles.activeIndicator, { backgroundColor: color }]} />}
            </View>
          );
        },
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          height: 70,
          paddingTop: 12,
          paddingBottom: 12,
          paddingHorizontal: 16,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
          borderBottomWidth: 0,
        },
        headerTintColor: '#1E293B',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: '#1E293B',
        },
        headerTitleAlign: 'center',
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          title: 'Schedule & Clock',
          tabBarLabel: 'Schedule',
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{
          title: 'Appointments',
          tabBarLabel: 'Appointments',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Me',
        }}
      />
    </Tab.Navigator>
  );
};

const LoadingScreen: React.FC = () => {
  const theme = useTheme();
  
  return (
    <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
        Loading WandaStaff...
      </Text>
    </View>
  );
};

const AppNavigator: React.FC = () => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [showSplash, setShowSplash] = React.useState(true);
  const [hasShownSplash, setHasShownSplash] = React.useState(false);

  React.useEffect(() => {
    const checkUser = async () => {
      try {
        const staffData = await AsyncStorage.getItem('staff');
        
        console.log('AppNavigator - Checking stored staff data:', staffData ? 'Found' : 'Not found');
        
        if (staffData) {
          const staff = JSON.parse(staffData);
          console.log('AppNavigator - Logged in user:', staff.firstName, staff.lastName);
          setUser(staff);
        } else {
          console.log('AppNavigator - No user logged in');
          setUser(null);
        }
      } catch (error) {
        console.error('AppNavigator - Error checking user:', error);
        setUser(null);
      }
      setLoading(false);
    };

    checkUser();

    // Check every second for changes (simple polling)
    const interval = setInterval(checkUser, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
    setHasShownSplash(true);
  };

  console.log('AppNavigator - User state:', user ? 'Logged in' : 'Not logged in', 'Loading:', loading, 'ShowSplash:', showSplash, 'HasShownSplash:', hasShownSplash);

  // Only show splash screen on initial app load, not after login
  if (showSplash && !hasShownSplash) {
    console.log('AppNavigator - Showing splash screen');
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (loading) {
    console.log('AppNavigator - Showing loading screen');
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainStackNavigator} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -12,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default AppNavigator;