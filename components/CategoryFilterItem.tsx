import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { getCategoryColor, hexToRgba } from '@/lib/colorGenerator';
import * as Haptics from 'expo-haptics';

interface CategoryFilterItemProps {
  item: { id: number; name: string; emoji: string; color?: string };
  isActive: boolean;
  onPress: () => void;
}

export function CategoryFilterItem({ item, isActive, onPress }: CategoryFilterItemProps) {
  const categoryColor = item.color || getCategoryColor(item.emoji);
  const inactiveBackgroundColor = 'rgba(245, 246, 248, 1)'; // #F5F6F8

  const handlePress = () => {
      Haptics.selectionAsync();
      onPress();
  }

  return (
    <TouchableOpacity
      style={[
          styles.container,
          { backgroundColor: isActive ? '#4F46E5' : 'transparent' }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer,
        {
          backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : inactiveBackgroundColor,
          borderColor: 'transparent',
          borderWidth: 1, // Keep constant
          shadowColor: isActive ? '#000' : 'transparent',
          shadowOpacity: isActive ? 0.1 : 0,
          shadowRadius: isActive ? 4 : 0,
          elevation: isActive ? 2 : 0,
        }
      ]}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>
      <Text style={[
        styles.label,
        {
          color: isActive ? '#FFFFFF' : '#121212',
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
      marginRight: 12,
      minWidth: 80, // Ensure touch target
      padding: 8,
      borderRadius: 24,
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
