import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { getCategoryColor, hexToRgba } from '@/lib/colorGenerator';

interface CategoryFilterItemProps {
  item: { id: number; name: string; emoji: string; color?: string };
  isActive: boolean;
  onPress: () => void;
}

export function CategoryFilterItem({ item, isActive, onPress }: CategoryFilterItemProps) {
  const categoryColor = item.color || getCategoryColor(item.emoji);
  const activeBackgroundColor = hexToRgba(categoryColor, 0.25);
  const inactiveBackgroundColor = 'rgba(245, 246, 248, 1)'; // #F5F6F8

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer,
        {
          backgroundColor: isActive ? activeBackgroundColor : inactiveBackgroundColor,
          borderColor: isActive ? categoryColor : 'transparent',
          borderWidth: 1, // Keep constant
          shadowColor: isActive ? categoryColor : 'transparent',
          shadowOpacity: isActive ? 0.2 : 0,
          shadowRadius: isActive ? 8 : 0,
          elevation: isActive ? 4 : 0,
        }
      ]}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>
      <Text style={[
        styles.label,
        {
          color: isActive ? categoryColor : '#121212',
          fontWeight: isActive ? '700' : '600'
        }
      ]}>
        {item.name}
      </Text>
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
      shadowOffset: { width: 0, height: 4 },
  },
  emoji: {
      fontSize: 32,
  },
  label: {
      fontSize: 12,
      textAlign: 'center',
  },
});
