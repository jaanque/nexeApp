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
import { FlatList, ListRenderItem, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
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
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false); // Pull to refresh

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

  const [categoryLayoutY, setCategoryLayoutY] = useState(250); // Default estimate

  if (loading) return <HomeScreenSkeleton />;

  // Calculate approximate header height for padding
  const HEADER_MAX_HEIGHT = insets.top + 100;
  // Category sticky offset: insets.top (where header is collapsed)
  const STICKY_OFFSET = insets.top;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ModernHeader
        greeting={getGreeting()}
        points={points}
        initials={getInitials()}
        isGuest={!session?.user}
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
            {/* Marketing Banners */}
            <View style={{ marginTop: 24 }}>
                <MarketingSlider banners={banners} />
            </View>

            {/* Placeholder for Sticky Categories */}
            <View
                style={{ height: 60, marginBottom: 24 }} // Height matches sticky bar content
                onLayout={(event) => {
                    const { y } = event.nativeEvent.layout;
                    // y is relative to contentWrapper top (which is paddingTop: 24 from top of scroll content)
                    // The actual scroll content y is: y + 24 (marginTop of wrapper? no wrapper is inside scrollview)
                    // Wait, contentWrapper is inside ScrollView.
                    // y is relative to contentWrapper.
                    // contentWrapper is first child.
                    // But we have paddingTop on ScrollView contentContainer.
                    // The y reported by onLayout is relative to the *parent view* (contentWrapper).
                    // Correct absolute scroll offset = y
                    setCategoryLayoutY(y);
                }}
            />

            {/* Rewards Section (Others) */}
            {rewardItems.length > 0 && (
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Más recompensas</Text>
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

            {/* Restaurants List */}
            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Comercios Nexe</Text>
                    <TouchableOpacity style={styles.viewAllButton}>
                        <Text style={styles.viewAllText}>Filtros</Text>
                        <Ionicons name="options-outline" size={16} color="#121212" />
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
          </View>
      </Animated.ScrollView>

      {/* Absolute Sticky Category Bar */}
      <StickyCategoryBar
        categories={categories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        scrollY={scrollY}
        layoutY={categoryLayoutY}
        headerMaxHeight={HEADER_MAX_HEIGHT}
        stickyTop={STICKY_OFFSET}
      />
    </View>
  );
}

interface StickyCategoryBarProps {
    categories: Category[];
    activeCategory: number | null;
    setActiveCategory: (id: number | null) => void;
    scrollY: any;
    layoutY: number;
    headerMaxHeight: number;
    stickyTop: number;
}

function StickyCategoryBar({ categories, activeCategory, setActiveCategory, scrollY, layoutY, headerMaxHeight, stickyTop }: StickyCategoryBarProps) {
    const animatedStyle = useAnimatedStyle(() => {
        // Calculate the initial absolute Y position on screen (when scrollY is 0)
        // contentWrapper starts at headerMaxHeight? No, contentContainerStyle paddingTop pushes content down.
        // But the View inside starts at 0 relative to content container.
        // Wait, layoutY is relative to contentWrapper.
        // contentWrapper has marginTop: -12.
        // So absolute Y relative to ScrollView content start = layoutY - 12?
        // Let's assume layoutY is correct relative to scroll content origin (after padding).
        // Initial Screen Y = layoutY + headerMaxHeight (padding) - 12 (margin) - scrollY.

        // Wait, contentWrapper is just a View inside ScrollView.
        // ScrollView has paddingTop: headerMaxHeight.
        // contentWrapper has marginTop: -12.
        // So the first pixel of contentWrapper is at (headerMaxHeight - 12).
        // The category placeholder is at `layoutY` inside contentWrapper.
        // So its Y position relative to ScrollView top (0) is: (headerMaxHeight - 12 + layoutY).

        const initialTop = headerMaxHeight - 12 + layoutY;
        const currentY = initialTop - scrollY.value;

        const translateY = Math.max(stickyTop, currentY);

        // Add shadow/background opacity based on stickiness
        // We want full opacity when it hits stickyTop
        const isSticky = currentY <= stickyTop;

        return {
            transform: [{ translateY }],
            // We can animate shadow opacity here if needed, but simple translation is key.
            zIndex: isSticky ? 1000 : 1, // Ensure it pops over content when sticky
        };
    });

    // Shadow style for sticky state
    const shadowStyle = useAnimatedStyle(() => {
         const initialTop = headerMaxHeight - 12 + layoutY;
         const currentY = initialTop - scrollY.value;
         // Fully show shadow when passed sticky point
         const opacity = currentY <= stickyTop ? withTiming(1, { duration: 200 }) : withTiming(0, { duration: 200 });

         return {
             shadowOpacity: opacity,
             elevation: opacity.value > 0.5 ? 4 : 0,
             borderBottomWidth: opacity.value > 0.5 ? 1 : 0,
             backgroundColor: currentY <= stickyTop ? 'rgba(255,255,255,0.95)' : 'transparent', // Solid when sticky
         };
    });

    return (
        <Animated.View style={[styles.stickyBar, animatedStyle, shadowStyle]}>
             <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
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
        </Animated.View>
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
      paddingVertical: 10, // Add vertical padding inside the scroll
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
  stickyBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 60, // Fixed height for bar
      justifyContent: 'center',
      // Background and shadow handled by animated style
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      borderBottomColor: 'rgba(0,0,0,0.05)',
  },
});
