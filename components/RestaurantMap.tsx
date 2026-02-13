import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

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
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: 19.432608,
        longitude: -99.133209,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      onPress={() => onSelectRestaurant(null)}
    >
      {restaurants.map((restaurant) => (
        <Marker
          key={restaurant.id}
          coordinate={{
            latitude: restaurant.latitude || 0,
            longitude: restaurant.longitude || 0,
          }}
          onPress={(e) => {
            e.stopPropagation();
            onSelectRestaurant(restaurant);
          }}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
});
