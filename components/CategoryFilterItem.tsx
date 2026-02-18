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
            activeOpacity={1}
        >
            <View style={[styles.emojiContainer, isActive && styles.activeEmojiContainer]}>
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
      marginRight: 12,
  },
  container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12, // Increased touch area
      paddingHorizontal: 20, // Wider pill for better readability
      borderRadius: 24,
      backgroundColor: '#F3F4F6',
      borderWidth: 1,
      borderColor: 'transparent',
      // added subtle shadow for depth
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
  },
  activeContainer: {
      backgroundColor: '#121212',
      shadowOpacity: 0.2, // Stronger shadow when active
      shadowRadius: 4,
      elevation: 4,
  },
  emojiContainer: {
      marginRight: 10, // More spacing
  },
  activeEmojiContainer: {
      // No change needed
  },
  emoji: {
      fontSize: 20, // Slightly larger emoji
  },
  label: {
      fontSize: 15, // Larger text
      fontWeight: '600',
      color: '#374151',
      letterSpacing: -0.3,
  },
  activeLabel: {
      color: '#FFFFFF',
      fontWeight: '700',
  },
});
