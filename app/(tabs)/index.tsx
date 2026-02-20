import { HomeHeader } from '@/components/home/HomeHeader';
import { Category, MenuItemResult, SortOption } from '@/components/home/HomeSections';
import { HomeScreenSkeleton } from '@/components/HomeScreenSkeleton';
import LocationPicker from '@/components/LocationPicker';
import { Banner } from '@/components/MarketingSlider';
import { ModernBusinessCard } from '@/components/ModernBusinessCard';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ListRenderItem, Platform, RefreshControl, StyleSheet, Text, UIManager, View } from 'react-native';
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
  const [isPickup, setIsPickup] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [address, setAddress] = useState<string>("Seleccionando ubicación...");
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);

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
        setIsFiltering(true);
        // We don't clear restaurants here to prevent layout jump
        fetchRestaurants(0, true).finally(() => {
            setIsFiltering(false);
        });
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
             if (pageNumber === 0) {
                 const { data, count } = await query.limit(50);
                 if (data) {
                     const sorted = [...data].sort((a, b) => {
                        const distA = (a.latitude && a.longitude) ? getDistanceInMeters(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude) : Infinity;
                        const distB = (b.latitude && b.longitude) ? getDistanceInMeters(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude) : Infinity;
                        return distA - distB;
                     });
                     setRestaurants(sorted);
                     setHasMore(false);
                 }
             }
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
      const locationMode = await AsyncStorage.getItem('user_location_mode');

      if (cachedLocation && cachedAddress) {
          const { latitude, longitude } = JSON.parse(cachedLocation);
          setUserLocation({ latitude, longitude });
          setAddress(cachedAddress);
      }

      if (locationMode === 'manual') {
          return;
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
          if (!cachedAddress) setAddress("Ubicación denegada");
          return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
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

  const handleLocationSelect = async (location: { latitude: number, longitude: number }, newAddress: string, isManual: boolean) => {
      setUserLocation(location);
      setAddress(newAddress);
      await AsyncStorage.setItem('user_location', JSON.stringify(location));
      await AsyncStorage.setItem('user_address', newAddress);
      await AsyncStorage.setItem('user_location_mode', isManual ? 'manual' : 'gps');

      if (!isManual) {
          getUserLocation();
      }

      // Trigger refresh
      setPage(0);
      setHasMore(true);
      fetchRestaurants(0, true);
  };

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
      const { data: menuData } = await supabase.from('items').select('*, locales(name)').limit(20);
      if (menuData) {
          const typedMenuData = menuData as unknown as MenuItemResult[];
          setAllRewards(typedMenuData);
          setRewardItems(typedMenuData);

          const shuffled = [...typedMenuData].sort(() => 0.5 - Math.random());
          setTrendingItems(shuffled.slice(0, 5));
      }
    } catch (error) { console.error("Error fetching featured items:", error); }
  }

  useEffect(() => {
      if (activeCategory === null) {
          setRewardItems(allRewards);
      } else {
          const filteredRewards = allRewards.filter(i => i.category_id === activeCategory);
          setRewardItems(filteredRewards);
      }
  }, [activeCategory, allRewards]);

  const renderFooter = useCallback(() => {
      if (!loadingMore) return null;
      return (
          <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator size="small" color="#111827" />
          </View>
      );
  }, [loadingMore]);

  const renderHeader = (
      <HomeHeader
          address={address}
          onAddressPress={() => setLocationPickerVisible(true)}
          isPickup={isPickup}
          setIsPickup={setIsPickup}
          banners={banners}
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          trendingItems={trendingItems}
          rewardItems={rewardItems}
          sortBy={sortBy}
          setSortBy={setSortBy}
          isFiltering={isFiltering}
      />
  );

  const renderRestaurantItem: ListRenderItem<Restaurant> = useCallback(({ item, index }) => {
      const distance = (userLocation && item.latitude && item.longitude)
          ? formatDistance(userLocation.latitude, userLocation.longitude, item.latitude, item.longitude)
          : undefined;

      return (
          <View style={[styles.gridItemContainer, { opacity: isFiltering ? 0.5 : 1 }]}>
              <ModernBusinessCard
                  restaurant={item}
                  isLast={false}
                  distance={distance}
                  isGrid={true}
              />
          </View>
      );
  }, [userLocation, isFiltering]);

  const handleLoadMore = () => {
      if (!loadingMore && hasMore && sortBy !== 'distance') {
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
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={3}
        removeClippedSubviews={true}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
            !loading ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, color: '#6B7280', textAlign: 'center' }}>
                        No se encontraron tiendas en esta categoría.
                    </Text>
                </View>
            ) : null
        }
        refreshControl={
            <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#111827"
                title="Actualizando catálogo..."
                titleColor="#111827"
                colors={['#111827']}
                progressBackgroundColor="#FFFFFF"
                progressViewOffset={Platform.OS === 'android' ? insets.top + 20 : 0}
            />
        }
        style={{ backgroundColor: '#FFFFFF' }}
      />

      <LocationPicker
          visible={locationPickerVisible}
          onClose={() => setLocationPickerVisible(false)}
          onSelectLocation={handleLocationSelect}
          initialLocation={userLocation || undefined}
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
});
