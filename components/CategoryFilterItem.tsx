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
                isActive && styles.activeContainer,
                isActive && item.color ? { backgroundColor: item.color } : null
            ]}
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.9} // Slight feedback
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
      marginRight: 10, // Compact spacing
  },
  container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 16, // Consistent border radius with other UI elements
      backgroundColor: '#F3F4F6', // Light gray background for inactive state instead of white+border
  },
  activeContainer: {
      backgroundColor: '#121212',
  },
  emojiContainer: {
      marginRight: 8,
  },
  emoji: {
      fontSize: 18,
  },
  label: {
      fontSize: 14,
      fontWeight: '600', // Semibold
      color: '#4B5563', // Gray 600
      letterSpacing: -0.2,
  },
  activeLabel: {
      color: '#121212',
  },
});
