import { View, StyleSheet, Text, FlatList, TouchableOpacity, ListRenderItem, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import RestaurantMap from '../../components/RestaurantMap';
import * as Location from 'expo-location';
import BottomSheet from '../../components/BottomSheet';
import { useRouter } from 'expo-router';

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

export default function ExploreScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurants();
    getUserLocation();
  }, []);

  async function getUserLocation() {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    } catch (error) {
      console.error("Error getting location:", error);
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
    <View style={styles.container}>
        {/* Map Background */}
        <View style={StyleSheet.absoluteFill}>
            <RestaurantMap
                restaurants={restaurants}
                selectedRestaurant={selectedRestaurant}
                onSelectRestaurant={setSelectedRestaurant}
                userLocation={userLocation}
            />
        </View>

        {/* Bottom Sheet Overlay */}
        <BottomSheet
            header={
                <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>Restaurantes</Text>
                    <View style={styles.searchBar}>
                         <Ionicons name="search" size={20} color="#666" style={{marginRight: 8}} />
                         <Text style={styles.searchText}>Buscar restaurante...</Text>
                    </View>
                </View>
            }
        >
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#333" />
                </View>
            ) : (
                <FlatList
                    data={restaurants}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },

  // Sheet Header
  sheetHeader: {
      paddingHorizontal: 20,
      paddingBottom: 10,
  },
  sheetTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 10,
      color: '#121212',
  },
  searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F5F6F8',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
  },
  searchText: {
      color: '#666',
      fontSize: 16,
  },

  // List Styles
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 100, // Extra padding
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    // Minimal shadow/border for clean look
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  image: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#eee',
  },
  infoContainer: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121212',
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: '700',
    color: '#333',
    fontSize: 12,
  },
  cuisine: {
    color: '#666',
    fontSize: 12,
  },
});
