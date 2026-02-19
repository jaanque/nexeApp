import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface CategoryFilterItemProps {
  item: { id: number; name: string; emoji: string; color?: string };
  isActive: boolean;
  onPress: () => void;
}

export function CategoryFilterItem({ item, isActive, onPress }: CategoryFilterItemProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
        <TouchableOpacity
            style={[
                styles.container,
                isActive ? styles.activeContainer : styles.inactiveContainer,
            ]}
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.9}
        >
            <View style={[styles.emojiContainer]}>
                <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <Text style={[styles.label, isActive && styles.activeLabel]}>
                {item.name}
            </Text>
        </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
      marginRight: 10,
  },
  container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 16,
      borderWidth: 1.5,
  },
  inactiveContainer: {
      backgroundColor: '#F3F4F6', // Light gray
      borderColor: '#F3F4F6', // Match background
  },
  activeContainer: {
      backgroundColor: '#FFFFFF', // White
      borderColor: '#111827', // Black border
  },
  emojiContainer: {
      marginRight: 8,
  },
  emoji: {
      fontSize: 18,
  },
  label: {
      fontSize: 14,
      fontWeight: '600',
      color: '#4B5563', // Gray 600
      letterSpacing: -0.2,
  },
  activeLabel: {
      color: '#111827', // Black text
      fontWeight: '700',
  },
});
