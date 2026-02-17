import { View, StyleSheet, Text, TextInput, ScrollView, TouchableOpacity, FlatList, ListRenderItem, ActivityIndicator, LayoutAnimation, Platform, UIManager, Keyboard, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [searchResultsRestaurants, setSearchResultsRestaurants] = useState<Restaurant[]>([]);
  const [searchResultsDishes, setSearchResultsDishes] = useState<MenuItemResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchInput, setShowSearchInput] = useState<boolean>(false); // New state for search toggle
  const [searching, setSearching] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

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
      }
    });

    fetchCategories();
    fetchData();
    getUserLocation();
  }, []);

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

  useEffect(() => {
      handleSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

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
      return d < 1000 ? `${Math.round(d)}m` : `${(d / 1000).toFixed(1)} km`;
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
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      if (showSearchInput) {
          handleCancelSearch();
      } else {
          setShowSearchInput(true);
          // Focus logic could be added here if we had a ref
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

  async function fetchData() {
    try {
      setLoading(true);
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
    finally { setLoading(false); }
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
        contentContainerStyle={{ paddingBottom: 80 }}
        keyboardDismissMode="on-drag"
        scrollEnabled={!isSearching || searchResultsRestaurants.length > 0 || searchResultsDishes.length > 0}
      >
          <ModernHeader
            greeting={getGreeting()}
            points={points}
            initials={getInitials()}
            onScanPress={() => router.push('/scan')}
            onWalletPress={() => router.push('/movements')}
            onProfilePress={() => router.push('/profile')}
            onSearchPress={toggleSearch}
          />

          {/* Search Input Area */}
          {showSearchInput && (
              <Animated.View entering={FadeInDown.duration(200)} style={{ paddingHorizontal: 20, marginBottom: 20, marginTop: 20 }}>
                  <View style={[styles.searchBar, { borderColor: '#2C2C2E', borderWidth: 1 }]}>
                      <Ionicons name="search-outline" size={20} color="#121212" style={{marginRight: 10}} />
                      <TextInput
                        placeholder="Buscar restaurantes o platos..."
                        placeholderTextColor="#6E7278"
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                        onFocus={handleFocus}
                      />
                       {searching ? (
                              <ActivityIndicator size="small" color="#6E7278" style={{ marginLeft: 8 }} />
                          ) : searchQuery.length > 0 ? (
                                <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={10}>
                                    <Ionicons name="close-circle" size={18} color="#CCCCCC" />
                                </TouchableOpacity>
                          ) : null}
                  </View>
                   <TouchableOpacity onPress={handleCancelSearch} style={styles.cancelButton}>
                        <Text style={styles.cancelButtonText}>Cerrar búsqueda</Text>
                   </TouchableOpacity>
              </Animated.View>
          )}

          {!isSearching && (
              <View style={{ marginTop: 20 }}>
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
                          <Ionicons name="search" size={48} color="#E0E0E0" />
                          <Text style={styles.noResultsText}>No se encontraron resultados</Text>
                      </View>
                  ) : null}
             </View>
          ) : (
            <>
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recompensas Activas</Text>
                        <TouchableOpacity style={styles.arrowButton}>
                            <Ionicons name="arrow-forward" size={20} color="#000" />
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

                <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.sectionContainer}>
                    <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
                        <Text style={styles.sectionTitle}>Comercios Nexe</Text>
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
    backgroundColor: '#FAFAFA', // Very light gray for depth
  },
  searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 16,
      height: 56,
      borderRadius: 28, // Fully rounded pill
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 6,
  },
  searchBarFocused: {
      borderColor: '#2C2C2E',
      borderWidth: 1,
  },
  searchInput: {
      flex: 1,
      fontSize: 16,
      color: '#121212',
      height: '100%',
  },
  cancelButton: {
      alignSelf: 'center',
      padding: 10,
  },
  cancelButtonText: {
      color: '#007AFF',
      fontSize: 16,
      fontWeight: '600',
  },
  filterScroll: {
      paddingLeft: 20,
      marginBottom: 32,
  },
  filterContent: {
      paddingRight: 20,
  },
  sectionContainer: {
      marginBottom: 32,
  },
  sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      marginBottom: 20,
  },
  sectionTitle: {
      fontSize: 24, // Larger title
      fontWeight: '800',
      color: '#121212',
      letterSpacing: -0.5,
  },
  arrowButton: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: '#F0F0F0',
      justifyContent: 'center',
      alignItems: 'center',
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
      fontSize: 18,
      fontWeight: 'bold',
      color: '#121212',
  },
  recentSearchesContainer: {
    paddingHorizontal: 24,
    marginTop: 10,
  },
  recentSearchesTitle: {
      fontSize: 14,
      color: '#6E7278',
      fontWeight: '600',
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
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
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
      fontSize: 16,
      fontWeight: 'bold',
      color: '#121212',
  },
  dishMeta: {
      fontSize: 13,
      color: '#6E7278',
  },
  dishPrice: {
      fontSize: 16,
      fontWeight: '600',
      color: '#121212',
  },
});
