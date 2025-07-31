import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  List,
  Divider,
  Avatar,
  Text,
  useTheme,
} from 'react-native-paper';

import { useAuth } from '@/components/common/AuthContext';
import { NavigationProps } from '@/types';

const MoreScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const theme = useTheme();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('MoreScreen - Starting sign out process');
              await signOut();
              console.log('MoreScreen - Sign out completed');
            } catch (error: any) {
              console.error('MoreScreen - Sign out error:', error);
              Alert.alert('Error', error.message || 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Section */}
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <Avatar.Text
            size={80}
            label={`${user.firstName[0]}${user.lastName[0]}`}
            style={{ backgroundColor: theme.colors.primary }}
          />
          <View style={styles.profileInfo}>
            <Title style={styles.profileName}>
              {user.firstName} {user.lastName}
            </Title>
            <Text style={styles.profileEmail}>{user.email}</Text>
            <Text style={styles.profileRole}>{user.role}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Menu Items */}
      <Card style={styles.menuCard}>
        <List.Item
          title="Payslips"
          description="View your salary statements"
          left={() => <List.Icon icon="file-document-outline" />}
          right={() => <List.Icon icon="chevron-right" />}
          onPress={() => navigation?.navigate('Payslips' as any)}
        />
        <Divider />
        
        <List.Item
          title="Commission"
          description="Track your sales performance"
          left={() => <List.Icon icon="chart-line" />}
          right={() => <List.Icon icon="chevron-right" />}
          onPress={() => navigation?.navigate('Commission' as any)}
        />
        <Divider />
        
        <List.Item
          title="Profile Settings"
          description="Update your personal information"
          left={() => <List.Icon icon="account-edit" />}
          right={() => <List.Icon icon="chevron-right" />}
          onPress={() => {
            // TODO: Implement profile settings
            Alert.alert('Coming Soon', 'Profile settings will be available in a future update');
          }}
        />
      </Card>

      {/* Support Section */}
      <Card style={styles.menuCard}>
        <List.Item
          title="Help & Support"
          description="Get help and contact support"
          left={() => <List.Icon icon="help-circle-outline" />}
          right={() => <List.Icon icon="chevron-right" />}
          onPress={() => {
            Alert.alert('Help & Support', 'Contact your manager or HR department for assistance');
          }}
        />
        <Divider />
        
        <List.Item
          title="About"
          description="App version and information"
          left={() => <List.Icon icon="information-outline" />}
          right={() => <List.Icon icon="chevron-right" />}
          onPress={() => {
            Alert.alert('WandaStaff', 'Version 1.0.0\n\nSalon Staff Mobile App');
          }}
        />
      </Card>

      {/* Sign Out */}
      <Card style={styles.menuCard}>
        <List.Item
          title="Sign Out"
          description="Log out of your account"
          left={() => <List.Icon icon="logout" color={theme.colors.error} />}
          right={() => <List.Icon icon="chevron-right" color={theme.colors.error} />}
          onPress={handleLogout}
          titleStyle={{ color: theme.colors.error }}
        />
        
        {/* Temporary direct sign out for testing */}
        <List.Item
          title="DIRECT SIGN OUT (TEST)"
          description="Sign out without confirmation"
          left={() => <List.Icon icon="logout-variant" color={theme.colors.error} />}
          onPress={async () => {
            console.log('Direct sign out button pressed');
            try {
              console.log('Calling signOut directly...');
              await signOut();
              console.log('Direct sign out completed');
            } catch (error) {
              console.error('Direct sign out error:', error);
              Alert.alert('Sign Out Failed', String(error));
            }
          }}
          titleStyle={{ color: theme.colors.error }}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
    elevation: 2,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  profileInfo: {
    marginLeft: 20,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 14,
    textTransform: 'capitalize',
    opacity: 0.8,
  },
  menuCard: {
    marginBottom: 16,
    elevation: 2,
  },
});

export default MoreScreen;