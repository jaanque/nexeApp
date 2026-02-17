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

  const activeColor = item.color || '#121212';

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
        <TouchableOpacity
            style={[
                styles.container,
                isActive && { 
                    backgroundColor: activeColor,
                    shadowColor: activeColor,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 4,
                },
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
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 24, // Pill shape
      backgroundColor: '#F3F4F6', // Light gray default
      borderWidth: 1,
      borderColor: 'transparent',
  },
  emojiContainer: {
      marginRight: 8,
  },
  activeEmojiContainer: {
      // No change needed, text handles it
  },
  emoji: {
      fontSize: 18,
  },
  label: {
      fontSize: 14,
      fontWeight: '600',
      color: '#374151', // Gray 700
      letterSpacing: -0.2,
  },
  activeLabel: {
      color: '#FFFFFF',
      fontWeight: '700',
  },
});
