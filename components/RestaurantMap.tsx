import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
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
  userLocation?: { latitude: number, longitude: number } | null;
}

export default function RestaurantMap({ restaurants, selectedRestaurant, onSelectRestaurant, userLocation }: RestaurantMapProps) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (userLocation && mapRef.current) {
        mapRef.current.animateToRegion({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        }, 1000);
    }
  }, [userLocation]);

  const initialRegion = {
    latitude: 19.432608,
    longitude: -99.133209,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={initialRegion}
      onPress={() => onSelectRestaurant(null)}
      showsUserLocation={!!userLocation} // Native maps have built-in support for showing user location dot
      showsMyLocationButton={true}
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
