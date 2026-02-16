import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar as RNStatusBar, ScrollView, Dimensions, LayoutChangeEvent } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
  withTiming,
  withSpring,
  runOnJS
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const PARALLAX_HEADER_HEIGHT = 300;
const STICKY_HEADER_HEIGHT = 60;

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
}

interface Restaurant {
  id: number;
  name: string;
  image_url: string;
  rating: number;
  cuisine_type: string;
  address: string;
  delivery_fee?: number;
  min_order?: number;
  delivery_time?: string;
}

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{ [key: number]: number }>({});

  // Tabs & Scrolling
  const [activeCategory, setActiveCategory] = useState<string>('');
  const scrollY = useSharedValue(0);
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const [categoryLayouts, setCategoryLayouts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    async function fetchRestaurantDetails() {
      try {
        setLoading(true);
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', id)
          .single();

        if (restaurantError) throw restaurantError;
        setRestaurant(restaurantData);

        const { data: menuData, error: menuError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', id);

        if (menuError) throw menuError;
        setMenuItems(menuData || []);

        // Set initial active category
        if (menuData && menuData.length > 0) {
            const firstCat = menuData[0].category || 'Otros';
            setActiveCategory(firstCat);
        }

      } catch (error) {
        console.error('Error fetching details:', error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchRestaurantDetails();
    }
  }, [id]);

  const sections = useMemo(() => {
    if (!menuItems.length) return [];
    const groups: { [key: string]: MenuItem[] } = {};
    menuItems.forEach(item => {
      const cat = item.category || 'Otros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return Object.keys(groups).sort().map(category => ({
      title: category,
      data: groups[category],
    }));
  }, [menuItems]);

  // Use a default category if sections exist and activeCategory is empty
  useEffect(() => {
     if (activeCategory === '' && sections.length > 0) {
         setActiveCategory(sections[0].title);
     }
  }, [sections]);


  const handleScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-PARALLAX_HEADER_HEIGHT, 0],
      [2, 1],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [-PARALLAX_HEADER_HEIGHT, 0, PARALLAX_HEADER_HEIGHT],
      [-PARALLAX_HEADER_HEIGHT / 2, 0, PARALLAX_HEADER_HEIGHT * 0.5],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }, { translateY }],
    };
  });

  const stickyHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
        scrollY.value,
        [PARALLAX_HEADER_HEIGHT - STICKY_HEADER_HEIGHT - insets.top, PARALLAX_HEADER_HEIGHT - insets.top],
        [0, 1],
        Extrapolation.CLAMP
    );
    return { opacity };
  });

  const handleCategoryPress = (category: string) => {
      setActiveCategory(category);
      const y = categoryLayouts[category];
      if (y !== undefined && scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: y - STICKY_HEADER_HEIGHT - insets.top, animated: true });
      }
  };

  const onLayoutCategory = (category: string, event: LayoutChangeEvent) => {
      const layout = event.nativeEvent.layout;
      setCategoryLayouts(prev => ({ ...prev, [category]: layout.y }));
  };

  // Cart Logic
  const handleAddToCart = (itemId: number) => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  };

  const handleRemoveFromCart = (itemId: number) => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) newCart[itemId]--;
      else delete newCart[itemId];
      return newCart;
    });
  };

  const totalPoints = useMemo(() => {
      let total = 0;
      menuItems.forEach((item) => {
        if (cart[item.id]) total += Math.round(item.price * 10) * cart[item.id];
      });
      return total;
  }, [cart, menuItems]);

  const handleCheckout = () => {
    const cartItems = menuItems.filter(item => cart[item.id]).map(item => ({
        ...item,
        quantity: cart[item.id],
        pointsPrice: Math.round(item.price * 10)
    }));
    router.push({
        pathname: "/checkout",
        params: { cartData: JSON.stringify(cartItems), restaurantName: restaurant?.name }
    });
  };

  if (loading || !restaurant) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#121212" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <RNStatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating Header (Back Button & Actions) */}
      <View style={[styles.floatingHeader, { paddingTop: insets.top + 10 }]}>
         <TouchableOpacity
            style={styles.iconButtonBlur}
            onPress={() => router.back()}
            activeOpacity={0.8}
         >
            <Ionicons name="arrow-back" size={24} color="#fff" />
         </TouchableOpacity>
         <View style={{flexDirection: 'row'}}>
            <TouchableOpacity style={[styles.iconButtonBlur, { marginRight: 12 }]}>
                <Ionicons name="search" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButtonBlur}>
                <Ionicons name="share-outline" size={22} color="#fff" />
            </TouchableOpacity>
         </View>
      </View>

      {/* Animated Sticky Header (Categories) */}
      <Animated.View style={[styles.stickyHeader, { paddingTop: insets.top, height: STICKY_HEADER_HEIGHT + insets.top }, stickyHeaderStyle]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}>
              {sections.map((section) => (
                  <TouchableOpacity
                    key={section.title}
                    onPress={() => handleCategoryPress(section.title)}
                    style={[styles.stickyTab, activeCategory === section.title && styles.stickyTabActive]}
                  >
                      <Text style={[styles.stickyTabText, activeCategory === section.title && styles.stickyTabTextActive]}>
                          {section.title}
                      </Text>
                  </TouchableOpacity>
              ))}
          </ScrollView>
      </Animated.View>

      <Animated.ScrollView
        ref={scrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Parallax Image */}
        <Animated.View style={[styles.heroImageContainer, headerStyle]}>
            <Image source={{ uri: restaurant.image_url }} style={styles.heroImage} contentFit="cover" />
            <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.heroGradient} />
        </Animated.View>

        {/* Content Body */}
        <View style={styles.contentContainer}>
            {/* Restaurant Info */}
            <View style={styles.infoSection}>
                <Text style={styles.title}>{restaurant.name}</Text>

                <View style={styles.metaRow}>
                    <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color="#000" />
                        <Text style={styles.ratingText}>{restaurant.rating}</Text>
                        <Text style={styles.ratingCount}>(500+)</Text>
                    </View>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.cuisineText}>{restaurant.cuisine_type}</Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.priceTier}>$$</Text>
                </View>

                <View style={styles.deliveryRow}>
                    <View style={styles.deliveryPill}>
                        <Ionicons name="time-outline" size={14} color="#121212" style={{marginRight: 4}} />
                        <Text style={styles.deliveryText}>20-30 min</Text>
                    </View>
                    <View style={[styles.deliveryPill, { marginLeft: 10 }]}>
                        <Ionicons name="bicycle-outline" size={14} color="#121212" style={{marginRight: 4}} />
                        <Text style={styles.deliveryText}>Entrega Gratis</Text>
                    </View>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Inline Categories (Visible before scroll) */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20, marginBottom: 20 }}>
                     {sections.map((section) => (
                        <TouchableOpacity
                            key={`inline-${section.title}`}
                            onPress={() => handleCategoryPress(section.title)}
                            style={[styles.inlineTab, activeCategory === section.title && styles.inlineTabActive]}
                        >
                            <Text style={[styles.inlineTabText, activeCategory === section.title && styles.inlineTabTextActive]}>{section.title}</Text>
                        </TouchableOpacity>
                     ))}
                </ScrollView>
            </View>

            {/* Menu Sections */}
            {sections.map((section) => (
                <View key={section.title} onLayout={(event) => onLayoutCategory(section.title, event)}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    {section.data.map((item) => {
                        const quantity = cart[item.id] || 0;
                        const pointsPrice = Math.round(item.price * 10);
                        return (
                            <View key={item.id} style={styles.menuItem}>
                                <TouchableOpacity style={styles.menuItemContent} activeOpacity={0.7} onPress={() => {}}>
                                    <View style={styles.textContainer}>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemPrice}>{pointsPrice} pts</Text>
                                        {item.description ? <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text> : null}
                                    </View>
                                    {item.image_url && (
                                        <View style={styles.imageWrapper}>
                                            <Image source={{ uri: item.image_url }} style={styles.itemImage} contentFit="cover" />
                                            {/* Add Button on Image */}
                                            {quantity === 0 && (
                                                <TouchableOpacity onPress={() => handleAddToCart(item.id)} style={styles.miniAddButton}>
                                                    <Ionicons name="add" size={20} color="#121212" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}
                                </TouchableOpacity>

                                {/* Quantity Controls (if > 0) */}
                                {quantity > 0 && (
                                    <View style={styles.qtyRow}>
                                         <View style={styles.qtyContainer}>
                                            <TouchableOpacity onPress={() => handleRemoveFromCart(item.id)} style={styles.qtyBtn}>
                                                <Ionicons name="remove" size={18} color="#000" />
                                            </TouchableOpacity>
                                            <Text style={styles.qtyNum}>{quantity}</Text>
                                            <TouchableOpacity onPress={() => handleAddToCart(item.id)} style={styles.qtyBtn}>
                                                <Ionicons name="add" size={18} color="#000" />
                                            </TouchableOpacity>
                                         </View>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            ))}
        </View>
      </Animated.ScrollView>

      {/* Floating Cart Bar */}
      {totalPoints > 0 && (
          <Animated.View entering={Animated.SlideInDown} exiting={Animated.SlideOutDown} style={[styles.cartBarContainer, { paddingBottom: insets.bottom + 10 }]}>
              <TouchableOpacity style={styles.cartBar} activeOpacity={0.9} onPress={handleCheckout}>
                  <View style={styles.cartCountBadge}>
                      <Text style={styles.cartCountVal}>{Object.values(cart).reduce((a, b) => a + b, 0)}</Text>
                  </View>
                  <Text style={styles.cartBarLabel}>Ver Pedido</Text>
                  <Text style={styles.cartBarTotal}>{totalPoints} pts</Text>
              </TouchableOpacity>
          </Animated.View>
      )}

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
  },

  // Header
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 100,
  },
  iconButtonBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    zIndex: 90,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  stickyTab: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginRight: 8,
      borderRadius: 20,
      backgroundColor: '#f5f5f5',
  },
  stickyTabActive: {
      backgroundColor: '#121212',
  },
  stickyTabText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#6E7278',
  },
  stickyTabTextActive: {
      color: '#fff',
  },

  // Hero Parallax
  heroImageContainer: {
      height: PARALLAX_HEADER_HEIGHT,
      width: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: -1,
  },
  heroImage: {
      width: '100%',
      height: '100%',
  },
  heroGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 120,
  },

  // Content
  contentContainer: {
      marginTop: PARALLAX_HEADER_HEIGHT - 30, // Pull up over image
      backgroundColor: '#fff',
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingTop: 24,
      minHeight: 1000, // Ensure scroll
  },
  infoSection: {
      paddingHorizontal: 20,
      marginBottom: 20,
  },
  title: {
      fontSize: 28,
      fontWeight: '800', // Extra Bold
      color: '#121212',
      marginBottom: 8,
      letterSpacing: -0.5,
  },
  metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
  },
  ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F5F6F8',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
  },
  ratingText: {
      fontSize: 14,
      fontWeight: 'bold',
      marginLeft: 4,
      color: '#121212',
  },
  ratingCount: {
      fontSize: 12,
      color: '#6E7278',
      marginLeft: 4,
  },
  metaDot: {
      marginHorizontal: 8,
      color: '#ccc',
  },
  cuisineText: {
      fontSize: 15,
      color: '#6E7278',
  },
  priceTier: {
      fontSize: 14,
      color: '#121212',
      fontWeight: '600',
  },
  deliveryRow: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  deliveryPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF',
      borderWidth: 1,
      borderColor: '#F0F0F0',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
  },
  deliveryText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#121212',
  },
  divider: {
      height: 1,
      backgroundColor: '#F5F6F8',
      marginVertical: 20,
  },

  // Inline Tabs
  inlineTab: {
      marginRight: 12,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#E0E0E0',
  },
  inlineTabActive: {
      backgroundColor: '#121212',
      borderColor: '#121212',
  },
  inlineTabText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#121212',
  },
  inlineTabTextActive: {
      color: '#fff',
  },

  // Menu Section
  sectionTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: '#121212',
      marginLeft: 20,
      marginBottom: 16,
      marginTop: 10,
  },
  menuItem: {
      paddingHorizontal: 20,
      marginBottom: 24,
  },
  menuItemContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
  },
  textContainer: {
      flex: 1,
      paddingRight: 16,
  },
  itemName: {
      fontSize: 17,
      fontWeight: '700',
      color: '#121212',
      marginBottom: 4,
  },
  itemPrice: {
      fontSize: 15,
      fontWeight: '600',
      color: '#121212',
      marginBottom: 6,
  },
  itemDescription: {
      fontSize: 14,
      color: '#6E7278',
      lineHeight: 20,
  },
  imageWrapper: {
      position: 'relative',
  },
  itemImage: {
      width: 110,
      height: 110,
      borderRadius: 16, // Professional Look
      backgroundColor: '#F5F6F8',
  },
  miniAddButton: {
      position: 'absolute',
      bottom: -8,
      right: -8,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
  },
  qtyRow: {
      marginTop: 12,
      flexDirection: 'row',
      justifyContent: 'flex-start',
  },
  qtyContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F5F6F8',
      borderRadius: 12,
      padding: 4,
  },
  qtyBtn: {
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
  },
  qtyNum: {
      marginHorizontal: 12,
      fontWeight: 'bold',
      fontSize: 15,
  },

  // Cart Bar
  cartBarContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      backgroundColor: 'transparent',
  },
  cartBar: {
      backgroundColor: '#121212',
      borderRadius: 20,
      paddingVertical: 16,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 10,
  },
  cartCountBadge: {
      backgroundColor: '#333',
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
  },
  cartCountVal: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 13,
  },
  cartBarLabel: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
  },
  cartBarTotal: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
  },
});
