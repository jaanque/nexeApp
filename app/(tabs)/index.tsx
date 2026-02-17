import { View, StyleSheet, Text, TextInput, ScrollView, TouchableOpacity, FlatList, ListRenderItem, ActivityIndicator, LayoutAnimation, Platform, UIManager, Keyboard, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useDebounce } from '@/hooks/useDebounce';
import { HomeScreenSkeleton } from '@/components/HomeScreenSkeleton';
import { CategoryFilterItem } from '@/components/CategoryFilterItem';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { ModernRewardCard } from '@/components/ModernRewardCard';
import { ModernBusinessCard } from '@/components/ModernBusinessCard';
import { MarketingSlider, Banner } from '@/components/MarketingSlider';
import Animated, { FadeInDown } from 'react-native-reanimated';

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
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [allRewards, setAllRewards] = useState<MenuItemResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]); // Banners State
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [searchResultsRestaurants, setSearchResultsRestaurants] = useState<Restaurant[]>([]);
  const [searchResultsDishes, setSearchResultsDishes] = useState<MenuItemResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchInput, setShowSearchInput] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false); // Pull to refresh

  const router = useRouter();
  const insets = useSafeAreaInsets();

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
        session?.user ? fetchPoints(session.user.id) : Promise.resolve()
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

  // Search Logic
  useEffect(() => {
      handleSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  // Location Sorting Logic
  useEffect(() => {
      if (popularRestaurants.length > 0) {
          if (userLocation) {
              const sorted = [...popularRestaurants].sort((a, b) => {
                  const distA = (a.latitude && a.longitude) ? getDistanceInMeters(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude) : Infinity;
                  const distB = (b.latitude && b.longitude) ? getDistanceInMeters(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude) : Infinity;
                  return distA - distB;
              });
              setSortedRestaurants(sorted);
          } else {
              setSortedRestaurants(popularRestaurants);
          }
      }
  }, [popularRestaurants, userLocation]);

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

  function handleCancelSearch() {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSearchQuery("");
      setSearchResultsRestaurants([]);
      setSearchResultsDishes([]);
      setIsSearching(false);
      setShowSearchInput(false);
      Keyboard.dismiss();
  }

  function toggleSearch() {
      Haptics.selectionAsync();
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      if (showSearchInput) {
          handleCancelSearch();
      } else {
          setShowSearchInput(true);
      }
  }

  function handleFocus() {
      if (!isSearching) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setIsSearching(true);
      }
  }

  async function handleSearch(query: string) {
      if (query.length < 3) {
          setSearchResultsRestaurants([]);
          setSearchResultsDishes([]);
          return;
      }
      setSearching(true);
      try {
          const { data: restData } = await supabase.from('restaurants').select('*').ilike('name', `%${query}%`).limit(5);
          if (restData) setSearchResultsRestaurants(restData);

          const { data: menuData } = await supabase.from('menu_items').select('*, restaurants(name)').ilike('name', `%${query}%`).limit(10);
          if (menuData) setSearchResultsDishes(menuData as any);
      } catch (error) {
          console.error("Search error:", error);
      } finally {
          setSearching(false);
      }
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
      }
    } catch (error) { console.error("Error data:", error); }
  }

  const getGreeting = () => {
      if (!session?.user) return 'Hola, Invitado';
      const meta = session.user.user_metadata;
      return `Hola, ${meta?.full_name?.split(' ')[0] || meta?.username || 'Viajero'}`;
  };

  const getInitials = () => {
      if (!session?.user) return '?';
      const name = session.user.user_metadata?.full_name || session.user.user_metadata?.username || 'U';
      return name.charAt(0).toUpperCase();
  };

  const renderRewardItem: ListRenderItem<MenuItemResult> = ({ item }) => (
      <ModernRewardCard item={item} />
  );

  if (loading) return <HomeScreenSkeleton />;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 0 }}
        keyboardDismissMode="on-drag"
        scrollEnabled={!isSearching || searchResultsRestaurants.length > 0 || searchResultsDishes.length > 0}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" colors={['#121212']} progressBackgroundColor="#FFFFFF" />
        }
        style={{ backgroundColor: '#121212' }}
      >
          <ModernHeader
            greeting={getGreeting()}
            points={points}
            initials={getInitials()}
            isGuest={!session?.user}
            onScanPress={() => router.push('/scan')}
            onWalletPress={() => router.push('/movements')}
            onProfilePress={() => router.push('/profile')}
            onSearchPress={toggleSearch}
          />

          <View style={styles.contentWrapper}>
            {/* Search Input Area */}
            {showSearchInput && (
                <Animated.View entering={FadeInDown.duration(200)} style={{ paddingHorizontal: 20, marginBottom: 20, marginTop: 20 }}>
                    <View style={[styles.searchBar, { borderColor: '#E5E7EB', borderWidth: 1 }]}>
                        <Ionicons name="search-outline" size={20} color="#6B7280" style={{marginRight: 10}} />
                        <TextInput
                            placeholder="Buscar restaurantes, platos..."
                            placeholderTextColor="#9CA3AF"
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                            onFocus={handleFocus}
                        />
                        {searching ? (
                                <ActivityIndicator size="small" color="#6B7280" style={{ marginLeft: 8 }} />
                            ) : searchQuery.length > 0 ? (
                                    <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={10}>
                                        <Ionicons name="close-circle" size={18} color="#D1D5DB" />
                                    </TouchableOpacity>
                            ) : null}
                    </View>
                    <TouchableOpacity onPress={handleCancelSearch} style={styles.cancelButton}>
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}

            {!isSearching && (
                <>
                    {/* Marketing Banners */}
                    <View style={{ marginTop: 24 }}>
                        <MarketingSlider banners={banners} />
                    </View>

                    {/* Categories */}
                    <View style={{ marginBottom: 32 }}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.filterScroll}
                            contentContainerStyle={styles.filterContent}
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
                    </View>
                </>
            )}


            {isSearching ? (
                <View style={styles.sectionContainer}>
                    {searchResultsRestaurants.length > 0 || searchResultsDishes.length > 0 ? (
                        <>
                            <Text style={[styles.sectionTitle, { marginLeft: 20, marginBottom: 16 }]}>Resultados</Text>
                            {searchResultsRestaurants.map(item => (
                                <ModernBusinessCard key={`rest-${item.id}`} restaurant={item} isLast={false} />
                            ))}
                            {searchResultsDishes.map(item => (
                                <DishResultCard key={`dish-${item.id}`} item={item} />
                            ))}
                        </>
                    ) : !searching && searchQuery.length >= 3 ? (
                        <View style={styles.noResultsContainer}>
                            <Ionicons name="search" size={48} color="#E5E7EB" />
                            <Text style={styles.noResultsText}>No se encontraron resultados</Text>
                        </View>
                    ) : null}
                </View>
            ) : (
                <>
                    {/* Rewards Section */}
                    {rewardItems.length > 0 && (
                        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.sectionContainer}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Recompensas</Text>
                                <TouchableOpacity style={styles.viewAllButton}>
                                    <Text style={styles.viewAllText}>Ver todo</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#4F46E5" />
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

                    {/* Restaurants List */}
                    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Comercios Nexe</Text>
                            <TouchableOpacity style={styles.viewAllButton}>
                                <Text style={styles.viewAllText}>Filtros</Text>
                                <Ionicons name="options-outline" size={16} color="#4F46E5" />
                            </TouchableOpacity>
                        </View>
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
                </>
            )}
          </View>
      </ScrollView>
    </View>
  );
}

// Simple Dish Card for Search
function DishResultCard({ item }: { item: MenuItemResult }) {
    const router = useRouter();
    return (
        <TouchableOpacity
            style={styles.dishResultRow}
            onPress={() => router.push(`/restaurant/${item.restaurant_id}`)}
        >
             <Image source={{ uri: item.image_url }} style={styles.dishImage} contentFit="cover" />
             <View style={styles.dishInfo}>
                <Text style={styles.dishName}>{item.name}</Text>
                <Text style={styles.dishMeta}>{item.restaurants?.name}</Text>
            </View>
            <Text style={styles.dishPrice}>${item.price}</Text>
        </TouchableOpacity>
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
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: 'hidden',
      paddingBottom: 100, // Bottom padding moved here
      minHeight: '100%',
  },
  searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 16,
      height: 52, // Slightly shorter
      borderRadius: 16, // Matches other elements
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
  },
  searchInput: {
      flex: 1,
      fontSize: 15,
      color: '#111827',
      height: '100%',
  },
  cancelButton: {
      alignSelf: 'center',
      padding: 10,
  },
  cancelButtonText: {
      color: '#4F46E5', // Indigo 600
      fontSize: 15,
      fontWeight: '600',
  },
  filterScroll: {
      paddingLeft: 24,
  },
  filterContent: {
      paddingRight: 24,
  },
  sectionContainer: {
      marginBottom: 32,
  },
  sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      marginBottom: 16,
  },
  sectionTitle: {
      fontSize: 20, // Clean size
      fontWeight: '700',
      color: '#111827', // Gray 900
      letterSpacing: -0.5,
  },
  viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      padding: 4,
  },
  viewAllText: {
      color: '#4F46E5', // Indigo 600
      fontSize: 14,
      fontWeight: '600',
  },
  carouselContent: {
      paddingHorizontal: 24,
      paddingRight: 8,
  },
  listContainer: {
      paddingHorizontal: 24,
  },
  noResultsContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
  },
  noResultsText: {
      marginTop: 16,
      fontSize: 16,
      fontWeight: '600',
      color: '#374151',
  },
  dishResultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#fff',
      marginHorizontal: 20,
      marginBottom: 12,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
  },
  dishImage: {
      width: 48,
      height: 48,
      borderRadius: 12,
      marginRight: 16,
      backgroundColor: '#f0f0f0',
  },
  dishInfo: {
      flex: 1,
  },
  dishName: {
      fontSize: 15,
      fontWeight: '600',
      color: '#111827',
  },
  dishMeta: {
      fontSize: 13,
      color: '#6B7280',
  },
  dishPrice: {
      fontSize: 15,
      fontWeight: '600',
      color: '#111827',
  },
});
