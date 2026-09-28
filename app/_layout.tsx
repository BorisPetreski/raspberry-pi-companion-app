import { useEffect } from 'react'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { DeviceProvider } from '@/device-context'
import { colors } from '@/theme'

void SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync()
  }, [])

  return (
    <SafeAreaProvider>
      <DeviceProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
            headerTintColor: colors.ink,
            contentStyle: { backgroundColor: colors.background }
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="pair" options={{ title: 'Pair a Pi', presentation: 'modal' }} />
        </Stack>
      </DeviceProvider>
    </SafeAreaProvider>
  )
}

