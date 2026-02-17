import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface Restaurant {
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

interface RestaurantDetailMapProps {
  restaurant: Restaurant;
  userLocation: { latitude: number, longitude: number } | null;
  style?: any;
}

export default function RestaurantDetailMap({ restaurant, userLocation, style }: RestaurantDetailMapProps) {
    return (
        <View style={[style, styles.container]}>
            <Text style={styles.text}>Map view is currently optimized for mobile devices.</Text>
            {restaurant && restaurant.address && (
                <Text style={styles.subText}>{restaurant.address}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  text: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  subText: {
      color: '#333',
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'center',
  }
});
