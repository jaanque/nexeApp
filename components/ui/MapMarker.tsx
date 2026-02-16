import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MapMarkerProps {
  isSelected?: boolean;
  onPress?: () => void;
  category?: string; // e.g., 'Restauración', 'Moda'
  price?: number; // Optional price to show instead of icon
}

export default function MapMarker({ isSelected, onPress, category, price }: MapMarkerProps) {

  // Choose icon based on category
  const getIconName = () => {
    switch (category) {
      case 'Restauración': return 'restaurant';
      case 'Moda': return 'shirt';
      case 'Servicios': return 'briefcase';
      case 'Ocio': return 'ticket';
      default: return 'location';
    }
  };

  return (
    <View style={[styles.container, isSelected && styles.containerSelected]}>
      {price ? (
          <Text style={[styles.text, isSelected && styles.textSelected]}>
             ${price}
          </Text>
      ) : (
          <Ionicons
            name={getIconName()}
            size={isSelected ? 18 : 14}
            color={isSelected ? '#FFFFFF' : '#121212'}
          />
      )}
      {/* Little arrow at bottom */}
      <View style={[styles.arrow, isSelected && styles.arrowSelected]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 36,
    height: 36,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  containerSelected: {
    backgroundColor: '#121212',
    borderColor: '#121212',
    transform: [{ scale: 1.2 }],
    zIndex: 10,
  },
  text: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#121212',
  },
  textSelected: {
    color: '#FFFFFF',
  },
  arrow: {
    position: 'absolute',
    bottom: -4,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },
  arrowSelected: {
      borderTopColor: '#121212',
  }
});
