import { CategoryFilterItem } from '@/components/CategoryFilterItem';
import { HomeScreenSkeleton } from '@/components/HomeScreenSkeleton';
import { Banner, MarketingSlider } from '@/components/MarketingSlider';
import { ModernBusinessCard } from '@/components/ModernBusinessCard';
import { ModernRewardCard } from '@/components/ModernRewardCard';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ListRenderItem, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
    price_euros?: number;
    discount_percentage?: number;
    image_url: string;
    restaurant_id: number;
    locales: {
        name: string;
    } | null;
    category_id?: number;
}

const PAGE_SIZE = 10;

export default function HomeScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [points, setPoints] = useState<number>(0);

  // Restaurant Data State
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Other Data State
  const [rewardItems, setRewardItems] = useState<MenuItemResult[]>([]);
  const [trendingItems, setTrendingItems] = useState<MenuItemResult[]>([]);
  const [allRewards, setAllRewards] = useState<MenuItemResult[]>([]);

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);

  // Filter & Sort State
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [refreshing, setRefreshing] = useState(false);
  const [address, setAddress] = useState<string>("Seleccionando ubicación...");

  const router = useRouter();
  const insets = useSafeAreaInsets();

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

      // Critical Path: Banners, Categories, and First Page of Restaurants
      // Featured items (Trending/Rewards) are non-critical and can load lazily
      const p1 = fetchCategories();
      const p2 = fetchBanners();
      const p3 = fetchRestaurants(0, true);
      const p4 = fetchFeaturedItems();

      await Promise.all([p1, p2, p3]);
      setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Reset state
    setPage(0);
    setHasMore(true);

    const p1 = fetchCategories();
    const p2 = fetchBanners();
    const p3 = fetchRestaurants(0, true);
    const p4 = fetchFeaturedItems();
    const p5 = session?.user ? fetchPoints(session.user.id) : Promise.resolve();
    const p6 = getUserLocation();

    await Promise.all([p1, p2, p3, p5, p6]);
    setRefreshing(false);
  }, [session]);

  // Sorting Effect - Refetch when sort changes
  useEffect(() => {
      if (!loading) {
        setPage(0);
        setHasMore(true);
        setRestaurants([]); // Clear current list to avoid mixing sort orders
        fetchRestaurants(0, true);
      }
  }, [sortBy, activeCategory]); // Also refetch when category changes

  async function fetchRestaurants(pageNumber: number, reset = false) {
    if (pageNumber > 0 && !hasMore) return;

    try {
        if (!reset) setLoadingMore(true);

        let query = supabase.from('locales').select('*', { count: 'exact' });

        // Apply Category Filter
        if (activeCategory !== null) {
            query = query.eq('category_id', activeCategory);
        }

        // Apply Sorting
        if (sortBy === 'distance' && userLocation) {
            // For distance, we currently fetch a larger set (client-side sort limitation)
            // Ideally we'd use a PostGIS RPC, but for now we fetch top 50 to sort
            // Note: Pagination with client-side sort is tricky. We'll fetch a fixed limit.
             if (pageNumber === 0) {
                 // Fetch more for distance to be somewhat accurate
                 const { data, count } = await query.limit(50);
                 if (data) {
                     const sorted = [...data].sort((a, b) => {
                        const distA = (a.latitude && a.longitude) ? getDistanceInMeters(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude) : Infinity;
                        const distB = (b.latitude && b.longitude) ? getDistanceInMeters(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude) : Infinity;
                        return distA - distB;
                     });
                     setRestaurants(sorted);
                     setHasMore(false); // Disable "load more" for distance sort to avoid complexity
                 }
             }
             // If page > 0, do nothing for distance sort (single page mode)
        } else {
            // Server-side Sort & Pagination
            if (sortBy === 'rating') {
                query = query.order('rating', { ascending: false });
            } else {
                query = query.order('id', { ascending: true }); // Default
            }

            const from = pageNumber * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, count } = await query.range(from, to);

            if (data) {
                if (reset) {
                    setRestaurants(data);
                } else {
                    setRestaurants(prev => [...prev, ...data]);
                }

                // Check if we reached the end
                if (data.length < PAGE_SIZE || (count && (from + data.length) >= count)) {
                    setHasMore(false);
                } else {
                    setPage(pageNumber + 1);
                }
            }
        }
    } catch (error) {
        console.error("Error fetching restaurants:", error);
    } finally {
        setLoadingMore(false);
    }
  }

  async function getUserLocation() {
    try {
      const cachedLocation = await AsyncStorage.getItem('user_location');
      const cachedAddress = await AsyncStorage.getItem('user_address');

      if (cachedLocation && cachedAddress) {
          const { latitude, longitude } = JSON.parse(cachedLocation);
          setUserLocation({ latitude, longitude });
          setAddress(cachedAddress);
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
          if (!cachedAddress) setAddress("Ubicación denegada");
          return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Reduced from Highest for performance/battery
      });
      const newLat = location.coords.latitude;
      const newLong = location.coords.longitude;

      setUserLocation({ latitude: newLat, longitude: newLong });
      await AsyncStorage.setItem('user_location', JSON.stringify({ latitude: newLat, longitude: newLong }));

      try {
          const reverseGeocode = await Location.reverseGeocodeAsync({
              latitude: newLat,
              longitude: newLong
          });

          if (reverseGeocode && reverseGeocode.length > 0) {
              const addr = reverseGeocode[0];
              const street = addr.street || addr.name || "Ubicación actual";
              const number = addr.streetNumber ? ` ${addr.streetNumber}` : "";
              const formattedAddress = `${street}${number}`;

              setAddress(formattedAddress);
              await AsyncStorage.setItem('user_address', formattedAddress);
          } else {
              if (!cachedAddress) setAddress("Ubicación actual");
          }
      } catch (geoError) {
          console.error("Reverse geocode error:", geoError);
          if (!cachedAddress) setAddress("Ubicación actual");
      }

    } catch (error) {
      console.error("Error getting location:", error);
      if (address === "Seleccionando ubicación...") {
          setAddress("Error al obtener ubicación");
      }
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

  async function fetchFeaturedItems() {
    try {
      // Reduced limit to 20 for horizontal lists (optimization)
      const { data: menuData } = await supabase.from('items').select('*, locales(name)').limit(20);
      if (menuData) {
          const typedMenuData = menuData as unknown as MenuItemResult[];
          setAllRewards(typedMenuData);
          setRewardItems(typedMenuData); // Initial set (can be filtered later client-side if needed for small datasets)

          const shuffled = [...typedMenuData].sort(() => 0.5 - Math.random());
          setTrendingItems(shuffled.slice(0, 5));
      }
    } catch (error) { console.error("Error fetching featured items:", error); }
  }

  // Filter rewards/trending locally when category changes (small dataset)
  useEffect(() => {
      if (activeCategory === null) {
          setRewardItems(allRewards);
      } else {
          const filteredRewards = allRewards.filter(i => i.category_id === activeCategory);
          setRewardItems(filteredRewards);
      }
  }, [activeCategory, allRewards]);

  const renderRewardItem: ListRenderItem<MenuItemResult> = useCallback(({ item }) => (
      <ModernRewardCard item={item} />
  ), []);

  const renderFooter = useCallback(() => {
      if (!loadingMore) return null;
      return (
          <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator size="small" color="#111827" />
          </View>
      );
  }, [loadingMore]);

  const renderHeader = useCallback(() => (
      <View>
        <ModernHeader
            address={address}
            onAddressPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            onWalletPress={() => router.push('/(tabs)/wallet')}
            onProfilePress={() => router.push('/(tabs)/profile')}
        />

        <View style={styles.headerContentWrapper}>
            {/* Marketing Banners */}
            <View style={{ marginTop: 12 }}>
                <MarketingSlider banners={banners} />
            </View>

            {/* Categories List */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterContent}
                style={{ flexGrow: 0, marginBottom: 24, marginTop: 16 }}
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

            {/* Trending Section */}
            {trendingItems.length > 0 && (
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>🔥 Últimas unidades (Vuelan)</Text>
                    </View>
                    <FlatList
                        data={trendingItems}
                        renderItem={renderRewardItem}
                        keyExtractor={(item) => item.id.toString()}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.carouselContent}
                        initialNumToRender={3}
                        maxToRenderPerBatch={3}
                        windowSize={3}
                    />
                </Animated.View>
            )}

            {/* Rewards Section */}
            {rewardItems.length > 0 && (
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Liquidación Total</Text>
                        <TouchableOpacity style={styles.viewAllButton}>
                            <Text style={styles.viewAllText}>Ver todo</Text>
                            <Ionicons name="chevron-forward" size={16} color="#111827" />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={rewardItems}
                        renderItem={renderRewardItem}
                        keyExtractor={(item) => item.id.toString()}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.carouselContent}
                        initialNumToRender={3}
                        maxToRenderPerBatch={3}
                        windowSize={3}
                    />
                </Animated.View>
            )}

            {/* Restaurants List Header */}
            <Animated.View entering={FadeInDown.delay(200).springify()}>
                <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
                    <Text style={styles.sectionTitle}>Tiendas en Liquidación</Text>
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
            </Animated.View>
        </View>
      </View>
  ), [banners, categories, activeCategory, trendingItems, rewardItems, sortBy, address, loadingMore]);

  const renderRestaurantItem: ListRenderItem<Restaurant> = useCallback(({ item, index }) => {
      const distance = (userLocation && item.latitude && item.longitude)
          ? formatDistance(userLocation.latitude, userLocation.longitude, item.latitude, item.longitude)
          : undefined;

      return (
          <View style={styles.gridItemContainer}>
              <ModernBusinessCard
                  restaurant={item}
                  isLast={false}
                  distance={distance}
                  isGrid={true}
              />
          </View>
      );
  }, [userLocation]);

  const handleLoadMore = () => {
      if (!loadingMore && hasMore && sortBy !== 'distance') {
          // Only load more if not sorting by distance (which uses fetch-all currently)
          // and if we have more pages
           // Use the current page state, incremented
           const nextPage = Math.ceil(restaurants.length / PAGE_SIZE);
           // Actually, simpler: Use the 'page' state variable we manage
           fetchRestaurants(page, false);
      }
  };

  if (loading) return <HomeScreenSkeleton />;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <FlatList
        data={restaurants}
        renderItem={renderRestaurantItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        columnWrapperStyle={{ paddingHorizontal: 14 }}
        keyboardDismissMode="on-drag"
        scrollEnabled={true}
        numColumns={2}
        key={2}
        initialNumToRender={4} // Optimized: Only render visible items (approx 2 rows)
        maxToRenderPerBatch={4} // Optimized
        windowSize={3} // Optimized: Reduce memory footprint
        removeClippedSubviews={true}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
            <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#111827"
                colors={['#111827']}
                progressBackgroundColor="#FFFFFF"
            />
        }
        style={{ backgroundColor: '#FFFFFF' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContentWrapper: {
      paddingBottom: 0,
  },
  gridItemContainer: {
      flex: 1,
      margin: 6,
      maxWidth: '50%',
  },
  filterContent: {
      paddingHorizontal: 20,
      paddingVertical: 4,
      alignItems: 'center',
  },
  sectionContainer: {
      marginBottom: 32,
  },
  sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 16,
  },
  sectionTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: '#111827',
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
      color: '#111827',
      fontSize: 14,
      fontWeight: '700',
  },
  carouselContent: {
      paddingHorizontal: 20,
      paddingRight: 4,
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
      backgroundColor: '#111827',
      borderColor: '#111827',
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
