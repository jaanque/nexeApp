import { CategoryFilterItem } from '@/components/CategoryFilterItem';
import { HomeScreenSkeleton } from '@/components/HomeScreenSkeleton';
import { Banner, MarketingSlider } from '@/components/MarketingSlider';
import { ModernBusinessCard } from '@/components/ModernBusinessCard';
import { ModernRewardCard } from '@/components/ModernRewardCard';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Session } from '@supabase/supabase-js';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, ListRenderItem, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View, Dimensions } from 'react-native';
import Animated, { FadeInDown, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Restaurant {
  id: number;
  name: string;
  image_url: string;
  rating: number;
  cuisine_type: string;
  address: string;
  latitude?: number;
  longitude?: number;
  category_id?: number;
  opening_time?: string;
  closing_time?: string;
}

type SortOption = 'default' | 'distance' | 'rating';

interface Category {
  id: number;
  name: string;
  emoji: string;
  color?: string;
}

interface MenuItemResult {
    id: number;
    name: string;
    description: string;
    price: number;
    image_url: string;
    restaurant_id: number;
    restaurants?: {
        name: string;
    };
    category_id?: number;
}

export default function HomeScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [popularRestaurants, setPopularRestaurants] = useState<Restaurant[]>([]);
  const [sortedRestaurants, setSortedRestaurants] = useState<Restaurant[]>([]);
  const [rewardItems, setRewardItems] = useState<MenuItemResult[]>([]);
  const [trendingItems, setTrendingItems] = useState<MenuItemResult[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [allRewards, setAllRewards] = useState<MenuItemResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]); // Banners State
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [refreshing, setRefreshing] = useState(false); // Pull to refresh
  const [address, setAddress] = useState<string>("Seleccionando ubicación...");

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
      onScroll: (event) => {
          scrollY.value = event.contentOffset.y;
      },
  });

  // Load initial session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchPoints(session.user.id);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchPoints(session.user.id);
      } else {
          setPoints(0);
      }
    });

    getUserLocation();
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
      setLoading(true);
      await Promise.all([
          fetchCategories(),
          fetchRestaurantsAndRewards(),
          fetchBanners()
      ]);
      setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([
        fetchCategories(),
        fetchRestaurantsAndRewards(),
        fetchBanners(),
        session?.user ? fetchPoints(session.user.id) : Promise.resolve(),
        getUserLocation()
    ]);
    setRefreshing(false);
  }, [session]);

  // Filtering Logic
  useEffect(() => {
      if (activeCategory === null) {
          setPopularRestaurants(allRestaurants);
          setRewardItems(allRewards);
      } else {
          const filteredRest = allRestaurants.filter(r => r.category_id === activeCategory);
          setPopularRestaurants(filteredRest);

          const filteredRewards = allRewards.filter(i => i.category_id === activeCategory);
          setRewardItems(filteredRewards);
      }
  }, [activeCategory, allRestaurants, allRewards]);

  // Sorting Logic
  useEffect(() => {
      if (popularRestaurants.length > 0) {
          let sorted = [...popularRestaurants];

          if (sortBy === 'distance' && userLocation) {
               sorted.sort((a, b) => {
                  const distA = (a.latitude && a.longitude) ? getDistanceInMeters(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude) : Infinity;
                  const distB = (b.latitude && b.longitude) ? getDistanceInMeters(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude) : Infinity;
                  return distA - distB;
              });
          } else if (sortBy === 'rating') {
              sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          } else {
               // Default: Sort by distance if available, otherwise ID (or "Smart Sort" in future)
               if (userLocation) {
                    sorted.sort((a, b) => {
                        const distA = (a.latitude && a.longitude) ? getDistanceInMeters(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude) : Infinity;
                        const distB = (b.latitude && b.longitude) ? getDistanceInMeters(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude) : Infinity;
                        return distA - distB;
                    });
               }
          }
          setSortedRestaurants(sorted);
      }
  }, [popularRestaurants, userLocation, sortBy]);

  async function getUserLocation() {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
          setAddress("Ubicación denegada");
          return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);

      // Reverse Geocode
      try {
          const reverseGeocode = await Location.reverseGeocodeAsync({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
          });

          if (reverseGeocode && reverseGeocode.length > 0) {
              const addr = reverseGeocode[0];
              // Format: Street + Number (or Name)
              const street = addr.street || addr.name || "Ubicación actual";
              const number = addr.streetNumber ? ` ${addr.streetNumber}` : "";
              setAddress(`${street}${number}`);
          } else {
              setAddress("Ubicación actual");
          }
      } catch (geoError) {
          console.error("Reverse geocode error:", geoError);
          setAddress("Ubicación actual");
      }

    } catch (error) {
      console.error("Error getting location:", error);
      setAddress("Error al obtener ubicación");
    }
  }

  function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
      const R = 6371e3;
      const φ1 = lat1 * Math.PI/180;
      const φ2 = lat2 * Math.PI/180;
      const Δφ = (lat2-lat1) * Math.PI/180;
      const Δλ = (lon2-lon1) * Math.PI/180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
  }

  function formatDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
      const d = getDistanceInMeters(lat1, lon1, lat2, lon2);
      return d < 1000 ? `a ${Math.round(d)}m` : `a ${(d / 1000).toFixed(1)} km`;
  }

  async function fetchPoints(userId: string) {
    try {
      const { data } = await supabase.from('profiles').select('points').eq('id', userId).single();
      if (data) setPoints(data.points || 0);
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  }

  async function fetchCategories() {
      try {
          const { data, error } = await supabase.from('categories').select('*').order('id', { ascending: true });
          if (!error && data) setCategories(data);
      } catch (e) { console.error("Error categories:", e); }
  }

  async function fetchBanners() {
      try {
          const { data, error } = await supabase.from('marketing_banners').select('*').eq('active', true).order('display_order', { ascending: true });
          if (!error && data) setBanners(data);
      } catch (e) { console.error("Error banners:", e); }
  }

  async function fetchRestaurantsAndRewards() {
    try {
      const { data: restData } = await supabase.from('restaurants').select('*').limit(100);
      if (restData) {
          setAllRestaurants(restData);
          setPopularRestaurants(restData);
      }
      const { data: menuData } = await supabase.from('menu_items').select('*, restaurants(name)').limit(50);
      if (menuData) {
          setAllRewards(menuData as any);
          setRewardItems(menuData as any);

          // For trending, we'll shuffle and pick 5 distinct items or just use a slice for demo
          // In a real app, this would be based on order count
          const shuffled = [...(menuData as any)].sort(() => 0.5 - Math.random());
          setTrendingItems(shuffled.slice(0, 5));
      }
    } catch (error) { console.error("Error data:", error); }
  }

  const renderRewardItem: ListRenderItem<MenuItemResult> = ({ item }) => (
      <ModernRewardCard item={item} />
  );

  if (loading) return <HomeScreenSkeleton />;

  // Calculate approximate header height for padding
  const HEADER_MAX_HEIGHT = insets.top + 100;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ModernHeader
        address={address}
        points={points}
        onAddressPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            // Future: Open address selector modal
        }}
        onWalletPress={() => router.push('/(tabs)/wallet')}
        onProfilePress={() => router.push('/(tabs)/profile')}
        scrollY={scrollY}
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 0, paddingTop: HEADER_MAX_HEIGHT }}
        keyboardDismissMode="on-drag"
        scrollEnabled={true}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
            <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FFFFFF"
                colors={['#121212']}
                progressBackgroundColor="#FFFFFF"
                progressViewOffset={HEADER_MAX_HEIGHT}
            />
        }
        style={{ backgroundColor: '#121212' }}
      >
          <View style={styles.contentWrapper}>
            {/* Marketing Banners - Visual Priority #1 */}
            <View style={{ marginTop: 24 }}>
                <MarketingSlider banners={banners} />
            </View>

            {/* Categories List */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterContent}
                style={{ flexGrow: 0, marginBottom: 24 }}
            >
                {categories.map((cat) => (
                    <CategoryFilterItem
                        key={cat.id}
                        item={cat}
                        isActive={activeCategory === cat.id}
                        onPress={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                    />
                ))}
            </ScrollView>

            {/* Trending Section - Visual Priority #2 */}
            {trendingItems.length > 0 && (
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>🔥 Tendencias en tu zona</Text>
                    </View>
                    <FlatList
                        data={trendingItems}
                        renderItem={({ item }) => <ModernRewardCard item={item} isTrending={true} />}
                        keyExtractor={(item) => item.id.toString()}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.carouselContent}
                        decelerationRate="fast"
                        snapToInterval={Dimensions.get('window').width * 0.8 + 16} // Custom snap
                        snapToAlignment="start"
                    />
                </Animated.View>
            )}

            {/* Rewards Section - Points Priority #3 */}
            {rewardItems.length > 0 && (
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Canjea y Ahorra</Text>
                        <TouchableOpacity style={styles.viewAllButton}>
                            <Text style={styles.viewAllText}>Ver todo</Text>
                            <Ionicons name="chevron-forward" size={16} color="#121212" />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={rewardItems}
                        renderItem={renderRewardItem}
                        keyExtractor={(item) => item.id.toString()}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.carouselContent}
                    />
                </Animated.View>
            )}

            {/* Restaurants List - Food Priority #2 */}
            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.sectionContainer}>
                <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
                    <Text style={styles.sectionTitle}>Recomendado para ti</Text>
                </View>

                {/* Sort Chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsContent}
                    style={{ marginBottom: 20 }}
                >
                    <TouchableOpacity
                        style={[styles.chip, sortBy === 'default' && styles.activeChip]}
                        onPress={() => {
                            Haptics.selectionAsync();
                            setSortBy('default');
                        }}
                    >
                        <Text style={[styles.chipText, sortBy === 'default' && styles.activeChipText]}>Recomendados</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.chip, sortBy === 'distance' && styles.activeChip]}
                        onPress={() => {
                            Haptics.selectionAsync();
                            setSortBy('distance');
                        }}
                    >
                        <Ionicons name="location-sharp" size={14} color={sortBy === 'distance' ? '#FFF' : '#374151'} />
                        <Text style={[styles.chipText, sortBy === 'distance' && styles.activeChipText]}>Cerca de mí</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.chip, sortBy === 'rating' && styles.activeChip]}
                        onPress={() => {
                            Haptics.selectionAsync();
                            setSortBy('rating');
                        }}
                    >
                        <Ionicons name="star" size={14} color={sortBy === 'rating' ? '#FFF' : '#374151'} />
                        <Text style={[styles.chipText, sortBy === 'rating' && styles.activeChipText]}>Mejor valorados</Text>
                    </TouchableOpacity>
                </ScrollView>

                <View style={styles.listContainer}>
                    {sortedRestaurants.map((restaurant, index) => {
                        const distance = (userLocation && restaurant.latitude && restaurant.longitude)
                            ? formatDistance(userLocation.latitude, userLocation.longitude, restaurant.latitude, restaurant.longitude)
                            : undefined;

                        return (
                            <ModernBusinessCard
                                key={restaurant.id}
                                restaurant={restaurant}
                                isLast={index === sortedRestaurants.length - 1}
                                distance={distance}
                            />
                        );
                    })}
                </View>
            </Animated.View>
          </View>
      </Animated.ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark background to match header
  },
  contentWrapper: {
      flex: 1,
      backgroundColor: '#F9FAFB',
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      marginTop: -12, // Reduced overlap for compact header
      paddingTop: 24,
      overflow: 'hidden',
      paddingBottom: 100, // Bottom padding moved here
      minHeight: '100%',
  },
  filterContent: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      alignItems: 'center',
  },
  sectionContainer: {
      marginBottom: 40, // Increased spacing
  },
  sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 20,
  },
  sectionTitle: {
      fontSize: 22, // Larger
      fontWeight: '800',
      color: '#111827', // Gray 900
      letterSpacing: -0.5,
  },
  viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      padding: 4,
      opacity: 0.7,
  },
  viewAllText: {
      color: '#121212', // Primary Green
      fontSize: 14,
      fontWeight: '700',
  },
  carouselContent: {
      paddingHorizontal: 20,
      paddingRight: 4,
  },
  listContainer: {
      paddingHorizontal: 20,
  },
  chipsContent: {
      paddingHorizontal: 20,
      gap: 10,
  },
  chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      gap: 6,
  },
  activeChip: {
      backgroundColor: '#121212',
      borderColor: '#121212',
  },
  chipText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#374151',
  },
  activeChipText: {
      color: '#FFFFFF',
  },
});
