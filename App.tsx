import React, { useEffect, useState } from 'react';
import { StatusBar, Platform, Dimensions } from 'react-native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { AuthProvider } from '@/components/common/AuthContext';
import { FeatureFlagsProvider } from '@/providers/FeatureFlagsProvider';
import AppNavigator from '@/navigation/AppNavigator';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    accent: '#03dac4',
    surface: '#ffffff',
    background: '#f5f5f5',
  },
};

const App: React.FC = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    console.log('WandaStaff app initialized');
    
    // Handle dimension changes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    // Handle custom window resize event from HTML
    const handleWindowResize = () => {
      if (Platform.OS === 'web') {
        setDimensions(Dimensions.get('window'));
      }
    };

    if (Platform.OS === 'web') {
      window.addEventListener('windowResized', handleWindowResize);
    }

    return () => {
      subscription?.remove();
      if (Platform.OS === 'web') {
        window.removeEventListener('windowResized', handleWindowResize);
      }
    };
  }, []);

  return (
    <PaperProvider theme={theme}>
      {Platform.OS !== 'web' && (
        <StatusBar 
          barStyle="light-content" 
          backgroundColor={theme.colors.primary}
        />
      )}
      <AuthProvider>
        <FeatureFlagsProvider>
          <AppNavigator />
        </FeatureFlagsProvider>
      </AuthProvider>
    </PaperProvider>
  );
};

export default App;