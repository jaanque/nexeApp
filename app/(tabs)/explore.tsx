import { View, StyleSheet, Text, FlatList, TouchableOpacity, ListRenderItem } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import RestaurantMap from '../../components/RestaurantMap';
import * as Location from 'expo-location';

// Interface matching the database schema
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

// Mock data matching the SQL inserts (Fallback)
const mockRestaurants: Restaurant[] = [
  {
    id: 1,
    name: 'Burger King',
    image_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80',
    rating: 4.5,
    cuisine_type: 'American • Burgers',
    address: '123 Main St',
    latitude: 19.432608,
    longitude: -99.133209,
  },
  {
    id: 2,
    name: 'Sushi Master',
    image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
    rating: 4.8,
    cuisine_type: 'Japanese • Sushi',
    address: '456 Elm St',
    latitude: 19.435200,
    longitude: -99.141000,
  },
  {
    id: 3,
    name: 'Pizza Hut',
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
    rating: 4.2,
    cuisine_type: 'Italian • Pizza',
    address: '789 Oak St',
    latitude: 19.429000,
    longitude: -99.130000,
  },
  {
    id: 4,
    name: 'Taco Bell',
    image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
    rating: 4.0,
    cuisine_type: 'Mexican • Tacos',
    address: '101 Pine St',
    latitude: 19.440000,
    longitude: -99.135000,
  },
  {
    id: 5,
    name: 'Indian Spice',
    image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356f36?w=800&q=80',
    rating: 4.7,
    cuisine_type: 'Indian • Curry',
    address: '202 Maple St',
    latitude: 19.425000,
    longitude: -99.138000,
  },
  {
    id: 6,
    name: 'Healthy Greens',
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    rating: 4.6,
    cuisine_type: 'Healthy • Salads',
    address: '303 Birch St',
    latitude: 19.438000,
    longitude: -99.145000,
  },
];

const RestaurantCard = ({ restaurant }: { restaurant: Restaurant }) => {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <Image
        source={{ uri: restaurant.image_url }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.infoContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{restaurant.rating}</Text>
          </View>
        </View>

        <Text style={styles.cuisine} numberOfLines={1}>{restaurant.cuisine_type}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Smaller card for the map popup
const MapPopupCard = ({ restaurant, onPress }: { restaurant: Restaurant; onPress: () => void }) => {
  return (
    <TouchableOpacity style={styles.popupCard} activeOpacity={0.9} onPress={onPress}>
      <Image
        source={{ uri: restaurant.image_url }}
        style={styles.popupImage}
        contentFit="cover"
      />
      <View style={styles.popupInfo}>
        <Text style={styles.popupName} numberOfLines={1}>{restaurant.name}</Text>
        <Text style={styles.popupCuisine} numberOfLines={1}>{restaurant.cuisine_type}</Text>
        <View style={styles.popupFooter}>
           <View style={styles.ratingContainerSmall}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingTextSmall}>{restaurant.rating}</Text>
          </View>
          <Text style={styles.popupAddress} numberOfLines={1}>{restaurant.address}</Text>
        </View>
      </View>
      <View style={styles.popupArrow}>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );
};

export default function ExploreScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(mockRestaurants);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchRestaurants();
    getUserLocation();
  }, []);

  async function getUserLocation() {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    } catch (error) {
      console.error("Error getting location:", error);
      setErrorMsg('Error getting location');
    }
  }

  async function fetchRestaurants() {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('id');

      if (error) {
        console.error('Error fetching restaurants:', error);
        // Fallback to mock data is already set initially
      } else if (data && data.length > 0) {
        // Merge fetched data with mock coordinates if missing from DB
        const mergedData = data.map((r, index) => ({
             ...r,
             latitude: r.latitude || mockRestaurants[index % mockRestaurants.length].latitude,
             longitude: r.longitude || mockRestaurants[index % mockRestaurants.length].longitude,
        }));
        setRestaurants(mergedData);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  }

  const renderItem: ListRenderItem<Restaurant> = ({ item }) => (
    <RestaurantCard restaurant={item} />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Restaurantes</Text>

        {/* Toggle Switch */}
        <View style={styles.toggleContainer}>
            <TouchableOpacity
                style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
                onPress={() => setViewMode('list')}
            >
                <Ionicons name="list" size={20} color={viewMode === 'list' ? '#fff' : '#666'} />
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
                onPress={() => setViewMode('map')}
            >
                <Ionicons name="map" size={20} color={viewMode === 'map' ? '#fff' : '#666'} />
            </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'list' ? (
        <FlatList
          data={restaurants}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.mapContainer}>
            <RestaurantMap
                restaurants={restaurants}
                selectedRestaurant={selectedRestaurant}
                onSelectRestaurant={setSelectedRestaurant}
                userLocation={userLocation}
            />

            {/* Popup Card */}
            {selectedRestaurant && (
                <View style={styles.popupContainer}>
                    <MapPopupCard
                        restaurant={selectedRestaurant}
                        onPress={() => {
                            // Handle navigation to detail here
                            console.log('Navigate to:', selectedRestaurant.name);
                        }}
                    />
                </View>
            )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 16,
      marginTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  toggleContainer: {
      flexDirection: 'row',
      backgroundColor: '#e0e0e0',
      borderRadius: 20,
      padding: 2,
  },
  toggleButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 18,
  },
  toggleButtonActive: {
      backgroundColor: '#333',
  },

  // List Styles
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Extra padding to clear the bottom tab bar
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#eee',
  },
  infoContainer: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: '700',
    color: '#333',
    fontSize: 14,
  },
  cuisine: {
    color: '#666',
    fontSize: 14,
  },

  // Map Styles
  mapContainer: {
      flex: 1,
      overflow: 'hidden',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
  },
  map: {
      width: '100%',
      height: '100%',
  },
  popupContainer: {
      position: 'absolute',
      bottom: 100, // Raise above tab bar
      left: 16,
      right: 16,
  },
  popupCard: {
      flexDirection: 'row',
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
      alignItems: 'center',
  },
  popupImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      backgroundColor: '#eee',
  },
  popupInfo: {
      flex: 1,
      marginLeft: 12,
      justifyContent: 'center',
  },
  popupName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#222',
      marginBottom: 2,
  },
  popupCuisine: {
      fontSize: 12,
      color: '#666',
      marginBottom: 4,
  },
  popupFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
  },
  ratingContainerSmall: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 8,
  },
  ratingTextSmall: {
      fontSize: 12,
      fontWeight: '700',
      marginLeft: 2,
      color: '#444',
  },
  popupAddress: {
      fontSize: 10,
      color: '#999',
      flex: 1,
  },
  popupArrow: {
      paddingLeft: 8,
  },
});
