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
}

export default function RestaurantMap({ restaurants, selectedRestaurant, onSelectRestaurant }: RestaurantMapProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Map view is currently optimized for mobile devices.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
  },
  text: {
    color: '#666',
    fontSize: 16,
  },
});
