import { View, StyleSheet, Text, TextInput, ScrollView, TouchableOpacity, FlatList, ListRenderItem, ActivityIndicator } from 'react-native';
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
}

export default function HomeScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [popularRestaurants, setPopularRestaurants] = useState<Restaurant[]>([]);
  const [rewardItems, setRewardItems] = useState<MenuItemResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Location State
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResultsRestaurants, setSearchResultsRestaurants] = useState<Restaurant[]>([]);
  const [searchResultsDishes, setSearchResultsDishes] = useState<MenuItemResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);

  // Filter State
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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

    fetchData();
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

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
      if (!lat1 || !lon1 || !lat2 || !lon2) return "200m"; // Default fallback

      const R = 6371; // Radius of the earth in km
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c; // Distance in km

      if (d < 1) {
          return `${Math.round(d * 1000)}m`;
      }
      return `${d.toFixed(1)} km`;
  }

  function deg2rad(deg: number) {
      return deg * (Math.PI / 180);
  }

  function handlePress(action: () => void) {
      if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      action();
  }

  async function handleSearch(query: string) {
      setSearchQuery(query);
      if (query.length < 3) {
          setIsSearching(false);
          setSearchResultsRestaurants([]);
          setSearchResultsDishes([]);
          return;
      }

      setIsSearching(true);
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

  async function fetchData() {
    try {
      setLoading(true);
      // Fetch popular restaurants
      const { data: restData } = await supabase
        .from('restaurants')
        .select('*')
        .gte('rating', 4.5)
        .order('rating', { ascending: false })
        .limit(10);

      if (restData) setPopularRestaurants(restData);

      // Fetch reward items (menu items)
      // Since we don't have a "rewards" flag, we'll just take some items
      const { data: menuData } = await supabase
        .from('menu_items')
        .select('*, restaurants(name)')
        .limit(10);

      if (menuData) setRewardItems(menuData as any);

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
                  <IconSymbol name="bell.fill" size={24} color="#121212" />
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
      >
          {/* 2. Hero Card (Wallet) */}
          <View style={styles.heroContainer}>
            <View style={styles.heroCard}>
                <View style={styles.heroLeft}>
                    <Text style={styles.heroPoints}>{points.toLocaleString()}</Text>
                    <Text style={styles.heroLabel}>Puntos Nexe disponibles</Text>
                </View>
                <TouchableOpacity
                    style={styles.heroButton}
                    activeOpacity={0.8}
                    onPress={() => handlePress(() => router.push('/scan'))}
                >
                    <IconSymbol name="qrcode.viewfinder" size={20} color="#fff" style={{marginRight: 6}} />
                    <Text style={styles.heroButtonText}>Escanear</Text>
                </TouchableOpacity>
            </View>
          </View>

          {/* 3. Search & Filters */}
          <View style={styles.searchSection}>
              <View style={styles.searchBar}>
                  <Ionicons name="search-outline" size={20} color="#6E7278" style={{marginRight: 10}} />
                  <TextInput
                    placeholder="Buscar comercio o oferta..."
                    placeholderTextColor="#6E7278"
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={handleSearch}
                  />
                  {isSearching && (
                        <TouchableOpacity onPress={() => handlePress(() => handleSearch(""))}>
                            <Ionicons name="close-circle" size={18} color="#6E7278" />
                        </TouchableOpacity>
                  )}
              </View>

              {!isSearching && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
                      {["Restauración", "Moda", "Servicios", "Ocio"].map((cat) => (
                          <TouchableOpacity
                            key={cat}
                            style={[styles.filterPill, activeCategory === cat && styles.filterPillActive]}
                            onPress={() => setActiveCategory(activeCategory === cat ? null : cat)}
                          >
                              <Text style={[styles.filterText, activeCategory === cat && styles.filterTextActive]}>{cat}</Text>
                          </TouchableOpacity>
                      ))}
                  </ScrollView>
              )}
          </View>

          {/* Search Results */}
          {isSearching ? (
             <View style={styles.sectionContainer}>
                 {searching ? (
                      <ActivityIndicator size="large" color="#000" style={{marginTop: 20}} />
                  ) : (
                      <>
                        <Text style={styles.sectionTitle}>Resultados</Text>
                        {searchResultsRestaurants.map(item => (
                            <BusinessRow key={`rest-${item.id}`} restaurant={item} />
                        ))}
                         {searchResultsDishes.map(item => (
                            <DishResultCard key={`dish-${item.id}`} item={item} />
                        ))}
                        {searchResultsRestaurants.length === 0 && searchResultsDishes.length === 0 && (
                            <Text style={{textAlign: 'center', marginTop: 20, color: '#6E7278'}}>No se encontraron resultados.</Text>
                        )}
                      </>
                  )}
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
                    {loading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <FlatList
                            data={rewardItems}
                            renderItem={renderRewardItem}
                            keyExtractor={(item) => item.id.toString()}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.carouselContent}
                        />
                    )}
                </View>

                {/* 5. Local Businesses List */}
                <View style={styles.sectionContainer}>
                    <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                        <Text style={styles.sectionTitle}>Comercios Nexe</Text>
                    </View>
                    {loading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <View style={styles.listContainer}>
                            {popularRestaurants.map((restaurant, index) => {
                                const distance = (userLocation && restaurant.latitude && restaurant.longitude)
                                    ? calculateDistance(userLocation.latitude, userLocation.longitude, restaurant.latitude, restaurant.longitude)
                                    : undefined;

                                return (
                                    <BusinessRow
                                        key={restaurant.id}
                                        restaurant={restaurant}
                                        isLast={index === popularRestaurants.length - 1}
                                        distance={distance}
                                    />
                                );
                            })}
                        </View>
                    )}
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
                <Text style={styles.businessMeta} numberOfLines={1}>{restaurant.cuisine_type} • {distance || '200m'}</Text>
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
      borderRadius: 14, // Squircle-ish
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
      backgroundColor: '#F5F6F8', // Smoke Gray
      borderRadius: 24,
      padding: 24,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  heroLeft: {
      flex: 1,
  },
  heroPoints: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#121212',
      letterSpacing: -1,
  },
  heroLabel: {
      fontSize: 14,
      color: '#6E7278',
      marginTop: 4,
  },
  heroButton: {
      backgroundColor: '#000000',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 18,
  },
  heroButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 14,
  },

  // Search & Filters
  searchSection: {
      marginBottom: 32,
  },
  searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F5F6F8',
      marginHorizontal: 20,
      paddingHorizontal: 16,
      height: 50,
      borderRadius: 16,
      marginBottom: 16,
  },
  searchInput: {
      flex: 1,
      fontSize: 16,
      color: '#121212',
  },
  filterScroll: {
      paddingLeft: 20,
  },
  filterContent: {
      paddingRight: 20,
  },
  filterPill: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: '#F5F6F8',
      marginRight: 10,
  },
  filterPillActive: {
      backgroundColor: '#000000',
  },
  filterText: {
      fontSize: 14,
      color: '#121212',
      fontWeight: '500',
  },
  filterTextActive: {
      color: '#FFFFFF',
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
      borderRadius: 16,
      backgroundColor: '#F5F6F8',
      justifyContent: 'center',
      alignItems: 'center',
  },
  carouselContent: {
      paddingHorizontal: 20,
      paddingRight: 8, // Adjust for last item spacing
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
      borderRadius: 16,
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
      borderRadius: 20,
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
      borderRadius: 16, // Squircle 16px
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
