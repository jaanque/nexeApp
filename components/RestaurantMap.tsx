import MapMarker from '@/components/ui/MapMarker';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
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
  topOffset?: number; // Height of the top header/overlay
}

export default function RestaurantMap({
    restaurants,
    selectedRestaurant,
    onSelectRestaurant,
    userLocation,
    topOffset = 60 // Default fallback
}: RestaurantMapProps) {
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();
  const hasCenteredOnUser = useRef(false);

  // If topOffset is provided (e.g. from Explore), use it.
  const effectiveTop = topOffset > 60 ? topOffset : (insets.top + topOffset);

  useEffect(() => {
    if (selectedRestaurant && selectedRestaurant.latitude && selectedRestaurant.longitude) {
       // Animate to selected restaurant with offset for the card
       mapRef.current?.animateToRegion({
            latitude: selectedRestaurant.latitude,
            longitude: selectedRestaurant.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
       }, 1000);
    } else if (userLocation && !selectedRestaurant && !hasCenteredOnUser.current) {
        // Initial user location
        mapRef.current?.animateToRegion({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        }, 1000);
        hasCenteredOnUser.current = true;
    }
  }, [userLocation, selectedRestaurant, effectiveTop]);

  const handleRecenter = () => {
      if (userLocation) {
          onSelectRestaurant(null);
          mapRef.current?.animateToRegion({
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
            // provider={PROVIDER_GOOGLE} // Removed to fallback to Apple Maps on iOS if key is missing
            onPress={() => onSelectRestaurant(null)}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={false}
            showsScale={false}
            mapPadding={{ top: effectiveTop, right: 0, bottom: 20, left: 0 }}
            initialRegion={{
                latitude: userLocation?.latitude || 40.416775,
                longitude: userLocation?.longitude || -3.703790,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            }}
        >
            {restaurants.map((restaurant) => {
                if (!restaurant.latitude || !restaurant.longitude) return null;
                return (
                    <Marker
                        key={restaurant.id}
                        coordinate={{
                            latitude: restaurant.latitude,
                            longitude: restaurant.longitude
                        }}
                        onPress={(e) => {
                            e.stopPropagation();
                            onSelectRestaurant(restaurant);
                        }}
                    >
                         <MapMarker
                            isSelected={selectedRestaurant?.id === restaurant.id}
                            category={restaurant.cuisine_type}
                        />
                    </Marker>
                );
            })}
        </MapView>

        {/* Recenter Button */}
        <TouchableOpacity
            style={[styles.recenterButton, { top: effectiveTop + 10 }]}
            onPress={handleRecenter}
            activeOpacity={0.8}
        >
            <Ionicons name="navigate" size={20} color="#121212" />
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
      flex: 1,
  },
  map: {
    flex: 1,
  },
  recenterButton: {
      position: 'absolute',
      right: 20,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      zIndex: 10,
  }
});
