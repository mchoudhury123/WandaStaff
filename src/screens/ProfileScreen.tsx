import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { firestore, auth } from '../services/firebase';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const staffData = await AsyncStorage.getItem('staff');
      if (staffData) {
        const staff = JSON.parse(staffData);
        setUser(staff);
        
        // Load business info from Firestore
        if (staff.businessId) {
          try {
            const businessDoc = await getDoc(doc(firestore, 'businesses', staff.businessId));
            if (businessDoc.exists()) {
              const businessData = businessDoc.data();
              setBusiness({ name: businessData.name || 'Your Salon' });
            } else {
              setBusiness({ name: 'Your Salon' });
            }
          } catch (businessError) {
            console.error('Error loading business:', businessError);
            setBusiness({ name: 'Your Salon' });
          }
        } else {
          setBusiness({ name: 'Your Salon' });
        }
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const handleSignOut = async () => {
    // Clear user data immediately
    await AsyncStorage.removeItem('staff');
    
    // Navigate to login
    navigation.navigate('Login');
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
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.firstName[0]}{user.lastName[0]}
            </Text>
          </View>
        </View>
        <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
        <Text style={styles.userRole}>{user.role}</Text>
        <Text style={styles.businessName}>at {business?.name}</Text>
      </View>



      {/* Menu Options */}
      <View style={styles.menuSection}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation?.navigate('AnnualLeave')}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#F59E0B20' }]}>
              <Icon name="calendar-remove" size={24} color="#F59E0B" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Annual Leave</Text>
              <Text style={styles.menuSubtitle}>Request time off, view balance</Text>
            </View>
          </View>
          <Icon name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation?.navigate('Payslips')}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#10B98120' }]}>
              <Icon name="file-document" size={24} color="#10B981" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Payslips</Text>
              <Text style={styles.menuSubtitle}>View and download payslips</Text>
            </View>
          </View>
          <Icon name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation?.navigate('Commission')}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#8B5CF620' }]}>
              <Icon name="chart-line" size={24} color="#8B5CF6" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Commission</Text>
              <Text style={styles.menuSubtitle}>Track earnings and bonuses</Text>
            </View>
          </View>
          <Icon name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Account Section */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#6B728020' }]}>
              <Icon name="account-edit" size={24} color="#6B7280" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Personal Details</Text>
              <Text style={styles.menuSubtitle}>Update your information</Text>
            </View>
          </View>
          <Icon name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#6B728020' }]}>
              <Icon name="cog" size={24} color="#6B7280" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Settings</Text>
              <Text style={styles.menuSubtitle}>App preferences</Text>
            </View>
          </View>
          <Icon name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#EF444420' }]}>
              <Icon name="logout" size={24} color="#EF4444" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: '#EF4444' }]}>Sign Out</Text>
              <Text style={styles.menuSubtitle}>Log out of your account</Text>
            </View>
          </View>
          <Icon name="chevron-right" size={24} color="#9CA3AF" />
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

  // Profile Header
  profileHeader: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 14,
    color: '#64748B',
  },



  // Menu Section
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },

  bottomSpacing: {
    height: 40,
  },
});

export default ProfileScreen;