import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

interface MapMarkerProps {
  isSelected?: boolean;
  onPress?: () => void;
  category?: string; // e.g., 'Restauración', 'Moda'
  price?: number; // Optional price to show instead of icon
  imageUrl?: string; // URL for the logo/image
}

export default function MapMarker({ isSelected, onPress, category, price, imageUrl }: MapMarkerProps) {

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
      {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.logo}
            contentFit="cover"
            transition={200}
          />
      ) : price ? (
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
    // If we have an image, remove padding so image fills the circle
    padding: 2,
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
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  containerSelected: {
    backgroundColor: '#121212',
    borderColor: '#121212',
    transform: [{ scale: 1.2 }],
    zIndex: 10,
    padding: 0, // Ensure selected marker also has no padding for image
  },
  logo: {
      width: '100%',
      height: '100%',
      borderRadius: 18, // Slightly less than container for padding effect
      backgroundColor: '#f0f0f0',
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
