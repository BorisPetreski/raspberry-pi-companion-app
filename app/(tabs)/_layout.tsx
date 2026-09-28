import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          height: 64,
          paddingTop: 6,
          paddingBottom: 7
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="device"
        options={{
          title: 'Device',
          tabBarIcon: ({ color, size }) => <Ionicons name="hardware-chip" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} />
        }}
      />
    </Tabs>
  )
}
