import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '@/services/authContext';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AuthScreen } from '@/components/auth-screen';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b0f19', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <>
      <AnimatedSplashOverlay />
      {isAuthenticated ? (
        <AppTabs />
      ) : (
        <AuthScreen />
      )}
    </>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
