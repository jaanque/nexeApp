import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface Restaurant {
  id: number;
  name: string;
  image_url: string;
  rating: number;
  cuisine_type: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

interface RestaurantMapProps {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  onSelectRestaurant: (restaurant: Restaurant | null) => void;
  userLocation?: { latitude: number, longitude: number } | null;
  topOffset?: number;
}

export default function RestaurantMap({ restaurants, selectedRestaurant, onSelectRestaurant, userLocation, topOffset }: RestaurantMapProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Map view is currently optimized for mobile devices.</Text>
      {userLocation && (
          <Text style={styles.subText}>
              Your Location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
          </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
    padding: 20,
  },
  text: {
    color: '#666',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subText: {
      color: '#888',
      fontSize: 12,
  }
});
