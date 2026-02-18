import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { customMapStyle } from '@/constants/darkMapStyle'; // Use dark style
import MapMarker from '@/components/ui/MapMarker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
  const hasCenteredOnUser = useRef(false);

  useEffect(() => {
    if (selectedRestaurant && selectedRestaurant.latitude && selectedRestaurant.longitude) {
       // Animate to selected restaurant with offset for the card
       mapRef.current?.animateToRegion({
            latitude: selectedRestaurant.latitude - 0.002, // Offset to show marker above card
            longitude: selectedRestaurant.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        }, 1000);
    } else if (userLocation && mapRef.current && !selectedRestaurant && !hasCenteredOnUser.current) {
        // Initial user location
        mapRef.current.animateToRegion({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
        }, 1000);
        hasCenteredOnUser.current = true;
    }
  }, [userLocation, selectedRestaurant]);

  const initialRegion = {
    latitude: 19.432608,
    longitude: -99.133209,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const handleRecenter = () => {
      if (userLocation && mapRef.current) {
          onSelectRestaurant(null);
          mapRef.current.animateToRegion({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        }, 800);
      }
  };

  return (
    <View style={styles.container}>
        <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        customMapStyle={customMapStyle}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={!!userLocation}
        showsMyLocationButton={false} // Custom button
        toolbarEnabled={false}
        moveOnMarkerPress={false}
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
            >
                <MapMarker
                    isSelected={selectedRestaurant?.id === restaurant.id}
                    category={restaurant.cuisine_type}
                    imageUrl={restaurant.image_url} // Pass image URL for logo
                />
            </Marker>
        ))}
        </MapView>

        {/* Recenter Button - Styled for Dark Mode */}
        <TouchableOpacity
            style={[styles.recenterButton, { top: insets.top + 80 }]}
            onPress={handleRecenter}
            activeOpacity={0.8}
        >
            <Ionicons name="navigate" size={20} color="#FFFFFF" />
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
      flex: 1,
      backgroundColor: '#212121', // Dark background while map loads
  },
  map: {
    width: '100%',
    height: '100%',
  },
  recenterButton: {
      position: 'absolute',
      right: 20,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#333333', // Dark grey button
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.5, // Stronger shadow for dark mode
      shadowRadius: 3.84,
      elevation: 5,
      zIndex: 10,
      borderWidth: 1,
      borderColor: '#444',
  }
});
