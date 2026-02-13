import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Haptics from 'expo-haptics';

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const activeColor = '#000000';
  const inactiveColor = Colors[colorScheme ?? 'light'].tabIconDefault;

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom + 10 }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

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

        // Determine if this is the "explore" tab which should be pill-shaped
        const isExplore = route.name === 'explore';

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[
              styles.tabItem,
              isExplore ? styles.tabItemExplore : styles.tabItemCircle,
              {
                backgroundColor: 'white',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 5,
              }
            ]}
          >
            {options.tabBarIcon?.({
                focused: isFocused,
                color: isFocused ? activeColor : inactiveColor,
                size: 22,
            })}
            {isExplore && (
                <Text style={{
                    color: isFocused ? activeColor : inactiveColor,
                    marginLeft: 8,
                    fontWeight: '600',
                    fontSize: 14
                }}>
                  {typeof label === 'string' ? label : 'Explorar'}
                </Text>
            )}
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'transparent',
    gap: 10, // Decreased gap
  },
  tabItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItemCircle: {
    width: 50, // Smaller size
    height: 50,
    borderRadius: 25,
  },
  tabItemExplore: {
    height: 50, // Smaller size
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
  },
});
