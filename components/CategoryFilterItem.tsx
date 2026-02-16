import React, { useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  interpolate
} from 'react-native-reanimated';
import { getCategoryColor, hexToRgba } from '@/lib/colorGenerator';

interface CategoryFilterItemProps {
  item: { id: number; name: string; emoji: string };
  isActive: boolean;
  onPress: () => void;
}

export function CategoryFilterItem({ item, isActive, onPress }: CategoryFilterItemProps) {
  const categoryColor = getCategoryColor(item.emoji);
  const activeValue = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    activeValue.value = withTiming(isActive ? 1 : 0, { duration: 300 });
  }, [isActive]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      activeValue.value,
      [0, 1],
      ['rgba(245, 246, 248, 1)', hexToRgba(categoryColor, 0.25)] // From #F5F6F8 (Surface) to Pastel Tint
    );

    const borderColor = interpolateColor(
      activeValue.value,
      [0, 1],
      ['rgba(0,0,0,0)', categoryColor]
    );

    const scale = interpolate(activeValue.value, [0, 1], [1, 1.05]);

    return {
      backgroundColor,
      borderColor,
      transform: [{ scale }],
      borderWidth: 1, // Constant border width to prevent layout shifts
      shadowColor: categoryColor,
      shadowOpacity: interpolate(activeValue.value, [0, 1], [0, 0.2]),
      shadowRadius: interpolate(activeValue.value, [0, 1], [0, 8]),
      shadowOffset: { width: 0, height: 4 },
      elevation: interpolate(activeValue.value, [0, 1], [0, 4]),
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
     const color = interpolateColor(
        activeValue.value,
        [0, 1],
        ['#121212', categoryColor] // Text turns to brand color
     );

     return {
        color,
        fontWeight: isActive ? '700' : '600' // Step change for weight
     };
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Animated.View style={[styles.iconContainer, animatedContainerStyle]}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </Animated.View>
      <Animated.Text style={[styles.label, animatedTextStyle]}>
        {item.name}
      </Animated.Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
      alignItems: 'center',
      marginRight: 20,
      minWidth: 70, // Ensure touch target
  },
  iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 24, // Squircle
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      // Default background is handled in animated style
  },
  emoji: {
      fontSize: 32,
  },
  label: {
      fontSize: 12,
      textAlign: 'center',
      // fontWeight handled in animated style
  },
});
