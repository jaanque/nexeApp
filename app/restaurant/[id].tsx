import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SectionList, StatusBar as RNStatusBar } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

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

const PARALLAX_HEADER_HEIGHT = 250;

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    async function fetchRestaurantDetails() {
      try {
        setLoading(true);
        // Fetch restaurant info
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', id)
          .single();

        if (restaurantError) throw restaurantError;
        setRestaurant(restaurantData);

        // Fetch menu items
        const { data: menuData, error: menuError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', id);

        if (menuError) throw menuError;
        setMenuItems(menuData || []);

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

  // Group items by category for SectionList
  const sections = useMemo(() => {
    if (!menuItems.length) return [];

    const groups: { [key: string]: MenuItem[] } = {};
    menuItems.forEach(item => {
      const cat = item.category || 'Otros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });

    // Sort categories alphabetically or by predefined order if needed
    return Object.keys(groups).sort().map(category => ({
      title: category,
      data: groups[category],
    }));
  }, [menuItems]);

  const handleAddToCart = (itemId: number) => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCart((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  };

  const handleRemoveFromCart = (itemId: number) => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const calculateTotalPoints = () => {
    let total = 0;
    menuItems.forEach((item) => {
      if (cart[item.id]) {
        total += Math.round(item.price * 10) * cart[item.id];
      }
    });
    return total;
  };

  const handleCheckout = () => {
    const cartItems = menuItems.filter(item => cart[item.id]).map(item => ({
        ...item,
        quantity: cart[item.id],
        pointsPrice: Math.round(item.price * 10)
    }));

    router.push({
        pathname: "/checkout",
        params: {
            cartData: JSON.stringify(cartItems),
            restaurantName: restaurant?.name
        }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#121212" />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Restaurant not found</Text>
      </View>
    );
  }

  const totalPoints = calculateTotalPoints();

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={styles.sectionHeaderContainer}>
      <Text style={styles.sectionHeaderTitle}>{title}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: MenuItem }) => {
    const pointsPrice = Math.round(item.price * 10);
    const quantity = cart[item.id] || 0;

    return (
      <View style={styles.menuItem}>
        {/* Left Side: Info */}
        <View style={styles.menuItemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            {item.description ? (
                <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
            ) : null}
            <Text style={styles.itemPrice}>{pointsPrice} pts</Text>
        </View>

        {/* Right Side: Image & Add Button */}
        <View style={styles.menuItemRight}>
            {item.image_url && (
                <Image source={{ uri: item.image_url }} style={styles.itemImage} contentFit="cover" />
            )}

            <View style={styles.actionContainer}>
                {quantity > 0 ? (
                    <View style={styles.qtyControls}>
                        <TouchableOpacity onPress={() => handleRemoveFromCart(item.id)} style={styles.qtyButton} hitSlop={10}>
                            <Ionicons name="remove" size={16} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{quantity}</Text>
                        <TouchableOpacity onPress={() => handleAddToCart(item.id)} style={styles.qtyButton} hitSlop={10}>
                            <Ionicons name="add" size={16} color="#000" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity onPress={() => handleAddToCart(item.id)} style={styles.addButton} hitSlop={10}>
                        <Ionicons name="add" size={20} color="#121212" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
      </View>
    );
  };

  const ListHeaderComponent = () => (
    <View style={{ backgroundColor: '#fff' }}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: restaurant.image_url }}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent']}
            style={styles.gradientOverlayTop}
          />

          {/* Navigation Buttons */}
          <View style={[styles.navBar, { paddingTop: insets.top }]}>
             <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
             </TouchableOpacity>
             <View style={{flexDirection: 'row'}}>
                <TouchableOpacity style={[styles.iconButton, { marginRight: 12 }]}>
                    <Ionicons name="search" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
                </TouchableOpacity>
             </View>
          </View>
        </View>

        {/* Restaurant Info Header */}
        <View style={styles.infoContainer}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>

          <View style={styles.metaContainer}>
             <View style={styles.metaRow}>
                <Ionicons name="star" size={14} color="#121212" />
                <Text style={styles.ratingText}>{restaurant.rating} (500+)</Text>
                <Text style={styles.metaText}> • {restaurant.cuisine_type}</Text>
                <Text style={styles.metaText}> • $</Text>
             </View>

             <View style={styles.deliveryInfoRow}>
                <View style={styles.deliveryPill}>
                    <Text style={styles.deliveryTime}>20-30 min</Text>
                </View>
                <Text style={styles.deliveryFee}> • Entrega: $0.00</Text>
             </View>
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
             <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="heart-outline" size={20} color="#121212" />
                <Text style={styles.actionButtonText}>Favorito</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-social-outline" size={20} color="#121212" />
                <Text style={styles.actionButtonText}>Compartir</Text>
             </TouchableOpacity>
          </View>

          <View style={styles.separator} />
        </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <RNStatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={ListHeaderComponent}
        stickySectionHeadersEnabled={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Floating Cart Button */}
      {totalPoints > 0 && (
        <View style={[styles.floatingButtonContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
            <TouchableOpacity style={styles.cartButton} onPress={handleCheckout} activeOpacity={0.9}>
                <View style={styles.cartCountCircle}>
                    <Text style={styles.cartCountText}>{Object.values(cart).reduce((a, b) => a + b, 0)}</Text>
                </View>
                <Text style={styles.cartButtonText}>Ver Pedido</Text>
                <Text style={styles.cartButtonPrice}>{totalPoints} pts</Text>
            </TouchableOpacity>
        </View>
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

  // Hero Section
  heroContainer: {
    height: PARALLAX_HEADER_HEIGHT,
    width: '100%',
    position: 'relative',
    backgroundColor: '#eee',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  navBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 10,
      zIndex: 10,
  },
  iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.3)', // Semi-transparent black
      justifyContent: 'center',
      alignItems: 'center',
  },

  // Info Header
  infoContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, // Slight curve over image
    borderTopRightRadius: 24,
    marginTop: -24, // Pull up over image
  },
  restaurantName: {
    fontSize: 32, // Large Hero Title
    fontWeight: '800', // Extra Bold
    color: '#121212',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  metaContainer: {
      marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
      fontWeight: 'bold',
      marginLeft: 4,
      fontSize: 14,
      color: '#121212',
  },
  metaText: {
      color: '#6E7278',
      fontSize: 14,
  },
  deliveryInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  deliveryPill: {
      backgroundColor: '#F5F6F8',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
  },
  deliveryTime: {
      fontSize: 12,
      fontWeight: '600',
      color: '#121212',
  },
  deliveryFee: {
      color: '#6E7278',
      fontSize: 13,
      marginLeft: 6,
  },

  // Actions
  actionRow: {
      flexDirection: 'row',
      marginBottom: 20,
  },
  actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F5F6F8', // Light Gray Pill
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 24,
      marginRight: 12,
  },
  actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#121212',
      marginLeft: 8,
  },
  separator: {
      height: 1,
      backgroundColor: '#F0F0F0',
      width: '100%',
  },

  // Section Headers
  sectionHeaderContainer: {
      backgroundColor: '#fff',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
  },
  sectionHeaderTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: '#121212',
  },

  // Menu Items (Uber Style)
  menuItem: {
      flexDirection: 'row',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
      backgroundColor: '#fff',
  },
  menuItemInfo: {
      flex: 1,
      paddingRight: 16,
      justifyContent: 'center',
  },
  itemName: {
      fontSize: 16,
      fontWeight: 'bold', // Strong
      color: '#121212',
      marginBottom: 6,
  },
  itemDescription: {
      fontSize: 14,
      color: '#6E7278', // Secondary Text
      marginBottom: 8,
      lineHeight: 20,
  },
  itemPrice: {
      fontSize: 15,
      fontWeight: '600',
      color: '#121212', // Black Price
  },
  menuItemRight: {
      alignItems: 'flex-end', // Right align image
      justifyContent: 'space-between',
  },
  itemImage: {
      width: 96, // Fixed Size
      height: 96,
      borderRadius: 12, // Squircle
      backgroundColor: '#F5F6F8',
      marginBottom: 8,
  },
  actionContainer: {
      alignItems: 'flex-end',
      minWidth: 96, // Match image width for alignment
  },
  addButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#F5F6F8', // Subtle button
      justifyContent: 'center',
      alignItems: 'center',
  },
  qtyControls: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 20,
      padding: 2,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
  },
  qtyButton: {
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
  },
  qtyText: {
      marginHorizontal: 8,
      fontWeight: 'bold',
      fontSize: 14,
      minWidth: 16,
      textAlign: 'center',
  },

  // Floating Button
  floatingButtonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 20,
      paddingTop: 16,
      backgroundColor: 'rgba(255,255,255,0.9)', // Slight blur background
      borderTopWidth: 1,
      borderTopColor: '#F0F0F0',
  },
  cartButton: {
      backgroundColor: '#121212', // Pure Black
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
      borderRadius: 16, // Squircle
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
  },
  cartCountCircle: {
      backgroundColor: '#333',
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
  },
  cartCountText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
  },
  cartButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
  },
  cartButtonPrice: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
  },
});
