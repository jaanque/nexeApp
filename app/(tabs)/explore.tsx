import { View, StyleSheet, Text, FlatList, TouchableOpacity, ListRenderItem, ActivityIndicator } from 'react-native';
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

import { useRouter } from 'expo-router';

const RestaurantCard = ({ restaurant }: { restaurant: Restaurant }) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => router.push(`/restaurant/${restaurant.id}`)}
    >
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
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('id');

      if (error) {
        console.error('Error fetching restaurants:', error);
        setRestaurants([]);
      } else if (data) {
        setRestaurants(data);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setRestaurants([]);
    } finally {
      setLoading(false);
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

      {loading ? (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#333" />
        </View>
      ) : viewMode === 'list' ? (
        restaurants.length > 0 ? (
          <FlatList
            data={restaurants}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay restaurantes disponibles.</Text>
          </View>
        )
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
                            router.push(`/restaurant/${selectedRestaurant.id}`);
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
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
