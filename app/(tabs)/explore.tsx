import { View, StyleSheet, Text, FlatList, TouchableOpacity, ListRenderItem, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import RestaurantMap from '@/components/RestaurantMap';
import * as Location from 'expo-location';
import BottomSheet from '@/components/BottomSheet';
import RestaurantMapCard from '@/components/RestaurantMapCard';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

interface Restaurant {
  id: number;
  name: string;
  image_url: string;
  rating: number;
  cuisine_type: string;
  address: string;
  latitude?: number;
  longitude?: number;
  min_price?: number; // Calculated locally
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
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [filterActive, setFilterActive] = useState(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchData();
    getUserLocation();
  }, []);

  useEffect(() => {
      if (filterActive) {
          const filtered = restaurants.filter(r => (r.min_price || 999999) <= userPoints);
          setFilteredRestaurants(filtered);
      } else {
          setFilteredRestaurants(restaurants);
      }
  }, [filterActive, restaurants, userPoints]);

  async function getUserLocation() {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    } catch (error) {
      console.error("Error getting location:", error);
    }
  }

  async function fetchData() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
          const { data } = await supabase.from('profiles').select('points').eq('id', session.user.id).single();
          if (data) setUserPoints(data.points || 0);
      }

      // Fetch restaurants and menu items to determine affordability
      const { data: restData, error } = await supabase
        .from('restaurants')
        .select('*, menu_items(price)')
        .order('id');

      if (!error && restData) {
        const processed = restData.map((r: any) => {
            const prices = r.menu_items?.map((m: any) => m.price) || [];
            const minPrice = prices.length > 0 ? Math.min(...prices) : 999999;
            return { ...r, min_price: minPrice };
        });
        setRestaurants(processed);
        setFilteredRestaurants(processed);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const renderItem: ListRenderItem<Restaurant> = ({ item }) => (
    <RestaurantCard restaurant={item} />
  );

  return (
    <View style={styles.container}>
        <StatusBar style="light" />

        {/* Map Background */}
        <View style={StyleSheet.absoluteFill}>
            <RestaurantMap
                restaurants={filteredRestaurants}
                selectedRestaurant={selectedRestaurant}
                onSelectRestaurant={setSelectedRestaurant}
                userLocation={userLocation}
            />
        </View>

        {/* Floating Filter Pill */}
        <View style={[styles.filterContainer, { top: insets.top + 10 }]}>
            <TouchableOpacity
                style={[styles.filterPill, filterActive && styles.filterPillActive]}
                onPress={() => setFilterActive(!filterActive)}
                activeOpacity={0.8}
            >
                <Ionicons
                    name={filterActive ? "checkmark-circle" : "wallet-outline"}
                    size={16}
                    color={filterActive ? "#121212" : "#FFFFFF"}
                    style={{marginRight: 6}}
                />
                <Text style={[styles.filterText, filterActive && styles.filterTextActive]}>
                    Mis Puntos ({userPoints.toLocaleString('es-ES')})
                </Text>
            </TouchableOpacity>
        </View>

        {/* Floating Scan Button (Bottom Center) - Only if no card is selected? Prompt says "Si no ve producto" */}
        {!selectedRestaurant && (
            <View style={styles.scanButtonContainer}>
                <TouchableOpacity
                    style={styles.scanButton}
                    onPress={() => router.push('/(tabs)/scan')} // Or open scanner
                >
                    <Ionicons name="scan-outline" size={20} color="#000" style={{marginRight: 8}} />
                    <Text style={styles.scanButtonText}>Escanear Ticket</Text>
                </TouchableOpacity>
            </View>
        )}

        {/* Floating Card (Popup) */}
        {selectedRestaurant && (
            <RestaurantMapCard
                restaurant={selectedRestaurant}
                onPress={() => router.push(`/restaurant/${selectedRestaurant.id}`)}
                onClose={() => setSelectedRestaurant(null)}
            />
        )}

        {/* Bottom Sheet Overlay - Only show if NO restaurant is selected */}
        {!selectedRestaurant && (
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
                        data={filteredRestaurants}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </BottomSheet>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212121', // Dark background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  // Filter Pill
  filterContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 20,
  },
  filterPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(33, 33, 33, 0.8)', // Semi-transparent dark
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
  },
  filterPillActive: {
      backgroundColor: '#FFFFFF', // Active state white
      borderColor: '#FFFFFF',
  },
  filterText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 14,
  },
  filterTextActive: {
      color: '#121212', // Black text on white
  },

  // Scan Button
  scanButtonContainer: {
      position: 'absolute',
      bottom: 100, // Above bottom sheet handle area or tab bar
      alignSelf: 'center',
      borderRadius: 30,
      zIndex: 15,
      backgroundColor: '#EBEBEB', // Light grey as per prompt fallback
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
  },
  scanButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
  },
  scanButtonText: {
      color: '#000000',
      fontWeight: '600',
      fontSize: 15,
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
