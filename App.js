import React, { useCallback } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Figtree_400Regular } from '@expo-google-fonts/figtree/400Regular';
import { Figtree_500Medium } from '@expo-google-fonts/figtree/500Medium';
import { Figtree_600SemiBold } from '@expo-google-fonts/figtree/600SemiBold';
import { Figtree_700Bold } from '@expo-google-fonts/figtree/700Bold';
import { Figtree_800ExtraBold } from '@expo-google-fonts/figtree/800ExtraBold';
import { YoungSerif_400Regular } from '@expo-google-fonts/young-serif/400Regular';
import { AppProvider, useApp } from './src/context/AppContext';
import CheckScreen from './src/screens/CheckScreen';
import ResultScreen from './src/screens/ResultScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RecentScreen from './src/screens/RecentScreen';
import { colors } from './src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator();

function Root() {
  const { ready, profile } = useApp();
  if (!ready) return null;
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={profile == null ? 'Profile' : 'Check'} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
        <Stack.Screen name="Check" component={CheckScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
        <Stack.Screen name="Review" component={ReviewScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Recent" component={RecentScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [loaded] = useFonts({ Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold, Figtree_800ExtraBold, YoungSerif_400Regular });
  const onLayout = useCallback(() => { if (loaded) SplashScreen.hideAsync().catch(() => {}); }, [loaded]);
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} onLayout={onLayout}>
        <AppProvider>
          <Root />
        </AppProvider>
        <StatusBar style="dark" />
      </View>
    </SafeAreaProvider>
  );
}
