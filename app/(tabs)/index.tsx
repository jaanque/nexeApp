import { View, StyleSheet, Text, TextInput, ScrollView, TouchableOpacity, FlatList, ListRenderItem, ActivityIndicator, LayoutAnimation, Platform, UIManager, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useDebounce } from '@/hooks/useDebounce';
import { HomeScreenSkeleton } from '@/components/HomeScreenSkeleton';
import { CategoryFilterItem } from '@/components/CategoryFilterItem';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  category_id?: number;
}

interface Category {
  id: number;
  name: string;
  emoji: string;
  color?: string;
}

// Interface for MenuItem search results
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

  // Data Store for Client-Side Filtering
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [allRewards, setAllRewards] = useState<MenuItemResult[]>([]);

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  // Location State
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [searchResultsRestaurants, setSearchResultsRestaurants] = useState<Restaurant[]>([]);
  const [searchResultsDishes, setSearchResultsDishes] = useState<MenuItemResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  // Filter State
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

  // Filter data when category changes (Client-Side)
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

  // Effect to handle search when debounced query changes
  useEffect(() => {
      handleSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  // Effect to sort restaurants when location or list changes
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

  function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
      const R = 6371e3; // metres
      const φ1 = lat1 * Math.PI/180; // φ, λ in radians
      const φ2 = lat2 * Math.PI/180;
      const Δφ = (lat2-lat1) * Math.PI/180;
      const Δλ = (lon2-lon1) * Math.PI/180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      return R * c;
  }

  function formatDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
      const d = getDistanceInMeters(lat1, lon1, lat2, lon2);
      if (d < 1000) {
          return `${Math.round(d)}m`;
      }
      return `${(d / 1000).toFixed(1)} km`;
  }

  function handlePress(action: () => void) {
      if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      action();
  }

  function handleCancelSearch() {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSearchQuery("");
      setSearchResultsRestaurants([]);
      setSearchResultsDishes([]);
      setIsSearching(false);
      setIsFocused(false);
      Keyboard.dismiss();
  }

  function handleFocus() {
      if (!isSearching) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setIsSearching(true);
      }
      setIsFocused(true);
  }

  async function handleSearch(query: string) {
      if (query.length < 3) {
          setSearchResultsRestaurants([]);
          setSearchResultsDishes([]);
          return;
      }

      setSearching(true);

      try {
          const { data: restData } = await supabase
            .from('restaurants')
            .select('*')
            .ilike('name', `%${query}%`)
            .limit(5);

          if (restData) setSearchResultsRestaurants(restData);

          const { data: menuData } = await supabase
            .from('menu_items')
            .select('*, restaurants(name)')
            .ilike('name', `%${query}%`)
            .limit(10);

          if (menuData) setSearchResultsDishes(menuData as any);

      } catch (error) {
          console.error("Search error:", error);
      } finally {
          setSearching(false);
      }
  }

  async function fetchPoints(userId: string) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();
      if (data) setPoints(data.points || 0);
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  }

  async function fetchCategories() {
      try {
          const { data, error } = await supabase.from('categories').select('*').order('id', { ascending: true });
          if (error) throw error;
          if (data) {
              setCategories(data);
          }
      } catch (e) {
          console.error("Error fetching categories:", e);
      }
  }

  async function fetchData() {
    try {
      setLoading(true);

      // Fetch ALL restaurants (or a large limit)
      const { data: restData } = await supabase
        .from('restaurants')
        .select('*')
        .limit(100);

      if (restData) {
          setAllRestaurants(restData);
          setPopularRestaurants(restData);
      }

      // Fetch ALL menu items (or a large limit)
      const { data: menuData } = await supabase
        .from('menu_items')
        .select('*, restaurants(name)')
        .limit(50);

      if (menuData) {
          setAllRewards(menuData as any);
          setRewardItems(menuData as any);
      }

    } catch (error) {
       console.error("Error fetching data", error);
    } finally {
        setLoading(false);
    }
  }


  const renderRewardItem: ListRenderItem<MenuItemResult> = ({ item }) => (
      <RewardCard item={item} />
  );

  const getGreeting = () => {
      if (!session?.user) return 'Hola, Invitado';
      const meta = session.user.user_metadata;
      const name = meta?.full_name?.split(' ')[0] || meta?.username || 'Viajero';
      return `Hola, ${name}`;
  };

  const getInitials = () => {
      if (!session?.user) return '?';
      const meta = session.user.user_metadata;
      const name = meta?.full_name || meta?.username || 'U';
      return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return <HomeScreenSkeleton />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* 1. Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View>
              <Text style={styles.greetingText}>{getGreeting()}</Text>
              <Text style={styles.statusText}>Nivel Explorador</Text>
          </View>
          <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconButton} onPress={() => {}}>
                  <IconSymbol name="bell" size={24} color="#121212" />
                  <View style={styles.notificationDot} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.avatarContainer} onPress={() => router.push('/profile')}>
                  <Text style={styles.avatarText}>{getInitials()}</Text>
              </TouchableOpacity>
          </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardDismissMode="on-drag"
        scrollEnabled={!isSearching || searchResultsRestaurants.length > 0 || searchResultsDishes.length > 0}
      >
          {/* 2. Hero Card (Wallet) */}
          {!isSearching && (
              <View style={styles.heroContainer}>
                <LinearGradient
                    colors={['#252525', '#121212']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    <View style={styles.heroLeft}>
                        <View style={{flexDirection: 'row', alignItems: 'flex-end'}}>
                            <Text style={styles.heroPoints}>{points.toLocaleString()}</Text>
                            <Text style={styles.heroPointsSuffix}> pts</Text>
                        </View>
                        <View style={styles.heroLabelContainer}>
                            <Ionicons name="wallet-outline" size={14} color="#9CA3AF" style={{ marginRight: 4 }} />
                            <Text style={styles.heroLabel}>Saldo disponible</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.heroButton}
                        activeOpacity={0.8}
                        onPress={() => handlePress(() => router.push('/scan'))}
                    >
                        <Ionicons name="qr-code-outline" size={18} color="#121212" style={{marginRight: 8}} />
                        <Text style={styles.heroButtonText}>Escanear</Text>
                    </TouchableOpacity>
                </LinearGradient>
              </View>
          )}

          {/* 3. Search & Filters */}
          <View style={styles.searchSection}>
              <View style={[styles.searchRow, { paddingHorizontal: 20 }]}>
                  <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
                      <Ionicons name="search-outline" size={20} color={isFocused ? "#121212" : "#6E7278"} style={{marginRight: 10}} />
                      <TextInput
                        placeholder="Buscar comercio o oferta..."
                        placeholderTextColor="#6E7278"
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onFocus={handleFocus}
                        // onBlur handled by cancel button or manual dismiss
                      />
                      {searching ? (
                          <ActivityIndicator size="small" color="#6E7278" style={{ marginLeft: 8 }} />
                      ) : searchQuery.length > 0 ? (
                            <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={10}>
                                <Ionicons name="close-circle" size={18} color="#CCCCCC" />
                            </TouchableOpacity>
                      ) : null}
                  </View>

                  {isSearching && (
                      <TouchableOpacity onPress={handleCancelSearch} style={styles.cancelButton}>
                          <Text style={styles.cancelButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                  )}
              </View>

              {!isSearching && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
                      {categories.map((cat) => (
                          <CategoryFilterItem
                              key={cat.id}
                              item={cat}
                              isActive={activeCategory === cat.id}
                              onPress={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                          />
                      ))}
                  </ScrollView>
              )}
          </View>

          {/* Search Results */}
          {isSearching ? (
             <View style={styles.sectionContainer}>
                  {searchResultsRestaurants.length > 0 || searchResultsDishes.length > 0 ? (
                      <>
                        <Text style={[styles.sectionTitle, { marginLeft: 20, marginBottom: 10 }]}>Resultados</Text>
                        {searchResultsRestaurants.map(item => (
                            <BusinessRow key={`rest-${item.id}`} restaurant={item} />
                        ))}
                         {searchResultsDishes.map(item => (
                            <DishResultCard key={`dish-${item.id}`} item={item} />
                        ))}
                      </>
                  ) : !searching && searchQuery.length >= 3 ? (
                      <View style={styles.noResultsContainer}>
                          <Ionicons name="search" size={48} color="#E0E0E0" />
                          <Text style={styles.noResultsText}>No se encontraron resultados</Text>
                          <Text style={styles.noResultsSubtext}>Intenta con otro término de búsqueda</Text>
                      </View>
                  ) : !searching ? (
                      <View style={styles.recentSearchesContainer}>
                          <Text style={styles.recentSearchesTitle}>Empieza a escribir...</Text>
                      </View>
                  ) : null}
             </View>
          ) : (
            <>
                {/* 4. Offers Near You (Rewards) - CHANGED TO REWARD ITEMS */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recompensas Activas</Text>
                        <TouchableOpacity
                            style={styles.arrowButton}
                            onPress={() => {}}
                        >
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
                </View>

                {/* 5. Local Businesses List - SORTED */}
                <View style={styles.sectionContainer}>
                    <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                        <Text style={styles.sectionTitle}>Comercios Nexe</Text>
                    </View>
                    <View style={styles.listContainer}>
                        {sortedRestaurants.map((restaurant, index) => {
                            const distance = (userLocation && restaurant.latitude && restaurant.longitude)
                                ? formatDistance(userLocation.latitude, userLocation.longitude, restaurant.latitude, restaurant.longitude)
                                : undefined;

                            return (
                                <BusinessRow
                                    key={restaurant.id}
                                    restaurant={restaurant}
                                    isLast={index === sortedRestaurants.length - 1}
                                    distance={distance}
                                />
                            );
                        })}
                    </View>
                </View>
            </>
          )}

      </ScrollView>
    </View>
  );
}

// Components

function RewardCard({ item }: { item: MenuItemResult }) {
    const pointsPrice = Math.round(item.price * 10);
    const router = useRouter();
    return (
        <TouchableOpacity
            style={styles.rewardCard}
            activeOpacity={0.9}
            onPress={() => {
                if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/restaurant/${item.restaurant_id}`);
            }}
        >
            <View style={styles.rewardImageContainer}>
                <Image source={{ uri: item.image_url }} style={styles.rewardImage} contentFit="cover" />

                {/* Top Offer Badge */}
                <View style={styles.topOfferBadge}>
                    <Ionicons name="trophy" size={12} color="#fff" style={{marginRight: 4}} />
                    <Text style={styles.topOfferText}>Oferta Top • 2 disponibles</Text>
                </View>

                {/* Heart Icon */}
                <View style={styles.heartIconOverlay}>
                    <Ionicons name="heart-outline" size={20} color="#fff" />
                </View>
            </View>

            <View style={styles.rewardContent}>
                <View style={styles.rewardTitleRow}>
                    <Text style={styles.rewardTitle} numberOfLines={1}>{item.name}</Text>
                    <IconSymbol name="color-wand-outline" size={16} color="green" />
                </View>
                <Text style={[styles.rewardSubtitle, { fontWeight: 'bold' }]} numberOfLines={1}>{pointsPrice} pts • {item.restaurants?.name}</Text>
            </View>
        </TouchableOpacity>
    );
}

function BusinessRow({ restaurant, isLast, distance }: { restaurant: Restaurant, isLast?: boolean, distance?: string }) {
    const router = useRouter();
    return (
        <TouchableOpacity
            style={[styles.businessRow, isLast && { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
            onPress={() => {
                if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/restaurant/${restaurant.id}`);
            }}
        >
            <Image source={{ uri: restaurant.image_url }} style={styles.businessImage} contentFit="cover" />
            <View style={styles.businessInfo}>
                <Text style={styles.businessName} numberOfLines={1}>{restaurant.name}</Text>
                <Text style={styles.businessMeta} numberOfLines={1}>{restaurant.cuisine_type} • {distance || '...'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
    );
}

function DishResultCard({ item }: { item: MenuItemResult }) {
    const router = useRouter();
    return (
        <TouchableOpacity
            style={styles.businessRow}
            onPress={() => router.push(`/restaurant/${item.restaurant_id}`)}
        >
             <Image source={{ uri: item.image_url }} style={styles.businessImage} contentFit="cover" />
             <View style={styles.businessInfo}>
                <Text style={styles.businessName}>{item.name}</Text>
                <Text style={styles.businessMeta}>{item.restaurants?.name}</Text>
            </View>
            <Text style={{fontWeight:'600'}}>${item.price}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Pure White
  },

  // Header
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 20,
      backgroundColor: '#FFFFFF',
  },
  greetingText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#121212',
  },
  statusText: {
      fontSize: 12,
      color: '#6E7278',
      marginTop: 2,
  },
  headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  iconButton: {
      position: 'relative',
      marginRight: 16,
      padding: 4,
  },
  notificationDot: {
      position: 'absolute',
      top: 4,
      right: 6,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'red',
      borderWidth: 1,
      borderColor: '#fff',
  },
  avatarContainer: {
      width: 40,
      height: 40,
      borderRadius: 12, // Professional Squircle
      backgroundColor: '#F5F6F8',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
  },
  avatarText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#121212',
  },

  // Hero Card
  heroContainer: {
      paddingHorizontal: 20,
      marginBottom: 24,
  },
  heroCard: {
      borderRadius: 24, // Larger Radius for premium feel
      padding: 24,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
  },
  heroLeft: {
      flex: 1,
  },
  heroPoints: {
      fontSize: 32,
      fontWeight: '800',
      color: '#FFFFFF', // White text
      letterSpacing: -1,
      lineHeight: 34,
  },
  heroPointsSuffix: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF', // White text
      marginBottom: 4,
  },
  heroLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
  },
  heroLabel: {
      fontSize: 14,
      color: '#9CA3AF', // Light Gray
      fontWeight: '500',
  },
  heroButton: {
      backgroundColor: '#FFFFFF', // White button
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: 20,
      paddingLeft: 16,
      paddingVertical: 12,
      borderRadius: 12, // Professional Squircle
      height: 48,
  },
  heroButtonText: {
      color: '#121212', // Black text
      fontWeight: '600',
      fontSize: 14,
  },

  // Search & Filters
  searchSection: {
      marginBottom: 32,
  },
  searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F5F6F8',
      paddingHorizontal: 16,
      height: 56, // Increased height for better touch target
      borderRadius: 12, // Professional Squircle
      marginBottom: 24, // Increased spacing
      borderWidth: 1,
      borderColor: 'transparent', // Default no border
  },
  searchBarFocused: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E0E0E0', // Subtle border on focus
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
  },
  searchInput: {
      flex: 1,
      fontSize: 16,
      color: '#121212',
      height: '100%', // Fill container
  },
  cancelButton: {
      marginLeft: 12,
      marginBottom: 16,
      padding: 8,
  },
  cancelButtonText: {
      fontSize: 16,
      color: '#007AFF', // System Blue or Corporate
      fontWeight: '600',
  },
  filterScroll: {
      paddingLeft: 20,
  },
  filterContent: {
      paddingRight: 20,
  },

  // Sections
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
      fontSize: 22,
      fontWeight: 'bold',
      color: '#121212',
      letterSpacing: -0.5,
  },
  arrowButton: {
      width: 32,
      height: 32,
      borderRadius: 12, // Squircle
      backgroundColor: '#F5F6F8',
      justifyContent: 'center',
      alignItems: 'center',
  },
  carouselContent: {
      paddingHorizontal: 20,
      paddingRight: 8, // Adjust for last item spacing
  },

  // No Results State
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
  noResultsSubtext: {
      marginTop: 8,
      fontSize: 14,
      color: '#6E7278',
  },
  recentSearchesContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  recentSearchesTitle: {
      fontSize: 14,
      color: '#6E7278',
      fontWeight: '600',
  },

  // Reward Card (Uber Eats Style)
  rewardCard: {
      width: 280, // Wider card
      marginRight: 16,
      backgroundColor: 'transparent', // Clean look
      marginBottom: 4,
  },
  rewardImageContainer: {
      height: 160,
      borderRadius: 16, // Professional Squircle
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: '#f0f0f0',
  },
  rewardImage: {
      width: '100%',
      height: '100%',
  },
  topOfferBadge: {
      position: 'absolute',
      top: 12,
      left: 12,
      backgroundColor: '#16a34a', // Green
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12, // Squircle
      flexDirection: 'row',
      alignItems: 'center',
  },
  topOfferText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 12,
  },
  heartIconOverlay: {
      position: 'absolute',
      top: 12,
      right: 12,
  },
  rewardContent: {
      marginTop: 12,
      paddingHorizontal: 4,
  },
  rewardTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
  },
  rewardTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#121212',
      flex: 1,
      marginRight: 8,
  },
  rewardSubtitle: {
      fontSize: 14,
      color: '#6E7278',
  },

  // Business Row
  listContainer: {
      paddingHorizontal: 20,
  },
  businessRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0', // Thin separator
  },
  businessImage: {
      width: 50,
      height: 50,
      borderRadius: 12, // Squircle 12px (Professional)
      backgroundColor: '#F5F6F8',
      marginRight: 16,
  },
  businessInfo: {
      flex: 1,
      marginRight: 10,
  },
  businessName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#121212',
      marginBottom: 2,
  },
  businessMeta: {
      fontSize: 13,
      color: '#6E7278',
  },
});
