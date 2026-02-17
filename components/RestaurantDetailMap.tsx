import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { customMapStyle } from '@/constants/mapStyle';

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
  if (!restaurant) {
      return null;
  }

  return (
      <MapView
          style={style || styles.map}
          customMapStyle={customMapStyle}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
              latitude: restaurant.latitude || 19.432608,
              longitude: restaurant.longitude || -99.133209,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
          }}
      >
          {restaurant.latitude && restaurant.longitude && (
              <Marker
                  coordinate={{
                      latitude: restaurant.latitude,
                      longitude: restaurant.longitude
                  }}
              />
          )}
          {userLocation && (
                <Marker
                  coordinate={{
                      latitude: userLocation.latitude,
                      longitude: userLocation.longitude
                  }}
                  pinColor="blue"
              />
          )}
      </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
      width: '100%',
      height: '100%',
  },
});
