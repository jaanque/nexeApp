import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarLabel: ({ focused, color }) => (focused ? <Text style={{ color, fontSize: 10 }}>Inicio</Text> : null),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorar',
          tabBarLabel: ({ focused, color }) => (focused ? <Text style={{ color, fontSize: 10 }}>Explorar</Text> : null),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="safari.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Escanear',
          tabBarLabel: ({ focused, color }) => (focused ? <Text style={{ color, fontSize: 10 }}>Escanear</Text> : null),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="qrcode.viewfinder" color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Cartera',
          tabBarLabel: ({ focused, color }) => (focused ? <Text style={{ color, fontSize: 10 }}>Cartera</Text> : null),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="creditcard.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarLabel: ({ focused, color }) => (focused ? <Text style={{ color, fontSize: 10 }}>Perfil</Text> : null),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
