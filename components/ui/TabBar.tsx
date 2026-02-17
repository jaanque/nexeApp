import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const activeColor = '#121212'; // Brand Black
  const inactiveColor = '#9CA3AF'; // Gray 400

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom + 8 }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const isScanTab = route.name === 'scan';

        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }

          if (process.env.EXPO_OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
          >
            {/* Custom Icons for cleaner aesthetic */}
            {route.name === 'index' ? (
                <Ionicons name={isFocused ? "home" : "home-outline"} size={24} color={isFocused ? activeColor : inactiveColor} />
            ) : route.name === 'explore' ? (
                <Ionicons name={isFocused ? "compass" : "compass-outline"} size={26} color={isFocused ? activeColor : inactiveColor} />
            ) : route.name === 'scan' ? (
                <Ionicons name={isFocused ? "scan" : "scan-outline"} size={24} color={isFocused ? activeColor : inactiveColor} />
            ) : route.name === 'wallet' ? (
                <Ionicons name={isFocused ? "wallet" : "wallet-outline"} size={24} color={isFocused ? activeColor : inactiveColor} />
            ) : route.name === 'profile' ? (
                <Ionicons name={isFocused ? "person" : "person-outline"} size={24} color={isFocused ? activeColor : inactiveColor} />
            ) : (
                options.tabBarIcon?.({
                    focused: isFocused,
                    color: isFocused ? activeColor : inactiveColor,
                    size: 24,
                })
            )}

            <Text style={[
                styles.label,
                { color: isFocused ? activeColor : inactiveColor, fontWeight: isFocused ? '700' : '500' }
            ]}>
              {typeof label === 'string' ? label : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end', // Align bottom to handle protruding button
    backgroundColor: '#fff',
    paddingTop: 12,
    borderTopWidth: 0, // Removed border for cleaner look
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
  label: {
      fontSize: 10,
      marginTop: 4,
  },
});
