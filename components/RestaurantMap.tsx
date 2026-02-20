import MapMarker from '@/components/ui/MapMarker';
import { Ionicons } from '@expo/vector-icons';
import Mapbox, { Camera } from '@/lib/mapbox';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

Mapbox.setAccessToken('pk.eyJ1IjoiamFucXVlcmFsdCIsImEiOiJjbWx1cTcyeTgwMDJkM2RzMXg0amsxZHRsIn0.Xwrer82K4qOVBa6OhjwMtw');

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
  const cameraRef = useRef<Camera>(null);
  const insets = useSafeAreaInsets();
  const hasCenteredOnUser = useRef(false);

  // If topOffset is provided (e.g. from Explore), use it.
  const effectiveTop = topOffset > 60 ? topOffset : (insets.top + topOffset);

  useEffect(() => {
    if (selectedRestaurant && selectedRestaurant.latitude && selectedRestaurant.longitude) {
       // Animate to selected restaurant with offset for the card
       cameraRef.current?.setCamera({
            centerCoordinate: [selectedRestaurant.longitude, selectedRestaurant.latitude],
            zoomLevel: 15,
            padding: { paddingTop: effectiveTop, paddingBottom: 20, paddingLeft: 0, paddingRight: 0 },
            animationDuration: 1000,
        });
    } else if (userLocation && !selectedRestaurant && !hasCenteredOnUser.current) {
        // Initial user location
        cameraRef.current?.setCamera({
            centerCoordinate: [userLocation.longitude, userLocation.latitude],
            zoomLevel: 14,
            animationDuration: 1000,
        });
        hasCenteredOnUser.current = true;
    }
  }, [userLocation, selectedRestaurant, effectiveTop]);

  const handleRecenter = () => {
      if (userLocation) {
          onSelectRestaurant(null);
          cameraRef.current?.setCamera({
            centerCoordinate: [userLocation.longitude, userLocation.latitude],
            zoomLevel: 15,
            animationDuration: 800,
        });
      }
  };

  return (
    <View style={styles.container}>
        <Mapbox.MapView
            style={styles.map}
            styleURL={Mapbox.StyleURL.Street}
            onPress={() => onSelectRestaurant(null)}
            scaleBarEnabled={false}
            logoEnabled={false}
            attributionEnabled={false}
        >
            <Mapbox.Camera
                ref={cameraRef}
                defaultSettings={{
                    centerCoordinate: userLocation ? [userLocation.longitude, userLocation.latitude] : [-3.703790, 40.416775],
                    zoomLevel: 12
                }}
            />

            <Mapbox.UserLocation visible={true} />

            {restaurants.map((restaurant) => {
                if (!restaurant.latitude || !restaurant.longitude) return null;
                return (
                    <Mapbox.PointAnnotation
                        key={restaurant.id}
                        id={restaurant.id.toString()}
                        coordinate={[restaurant.longitude, restaurant.latitude]}
                        onSelected={() => onSelectRestaurant(restaurant)}
                    >
                         <MapMarker
                            isSelected={selectedRestaurant?.id === restaurant.id}
                            category={restaurant.cuisine_type}
                        />
                    </Mapbox.PointAnnotation>
                );
            })}
        </Mapbox.MapView>

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
