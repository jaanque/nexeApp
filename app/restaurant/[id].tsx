import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
}

const PARALLAX_HEADER_HEIGHT = 250;

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    if (id) {
      fetchRestaurantDetails();
    }
  }, [id]);

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

  const handleAddToCart = (itemId: number) => {
    setCart((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  };

  const handleRemoveFromCart = (itemId: number) => {
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
        // Assume price * 10 is the points cost
        total += Math.round(item.price * 10) * cart[item.id];
      }
    });
    return total;
  };

  const handleCheckout = () => {
    // Pass cart data as a stringified object
    // We only need the items in the cart
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
        <ActivityIndicator size="large" color="#000" />
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

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: restaurant.image_url }}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.1)']}
            style={styles.gradientOverlay}
          />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.favoriteButton}>
            <Ionicons name="heart-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Restaurant Info Header */}
        <View style={styles.infoContainer}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <View style={styles.metaRow}>
             <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color="#000" />
                <Text style={styles.ratingText}>{restaurant.rating}</Text>
             </View>
             <Text style={styles.metaText}> • {restaurant.cuisine_type} • {restaurant.address}</Text>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Menú</Text>
          {menuItems.map((item) => {
            const pointsPrice = Math.round(item.price * 10);
            const quantity = cart[item.id] || 0;

            return (
                <View key={item.id} style={styles.menuItem}>
                <View style={styles.menuItemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.description && (
                        <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
                    )}
                    <Text style={styles.itemPrice}>{pointsPrice} pts</Text>
                </View>
                <View style={styles.rightSection}>
                    {item.image_url && (
                        <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                    )}

                    {/* Add/Remove Buttons */}
                    <View style={styles.qtyContainer}>
                        {quantity > 0 ? (
                            <View style={styles.qtyControls}>
                                <TouchableOpacity onPress={() => handleRemoveFromCart(item.id)} style={styles.qtyButton}>
                                    <Ionicons name="remove" size={16} color="#000" />
                                </TouchableOpacity>
                                <Text style={styles.qtyText}>{quantity}</Text>
                                <TouchableOpacity onPress={() => handleAddToCart(item.id)} style={styles.qtyButton}>
                                    <Ionicons name="add" size={16} color="#000" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity onPress={() => handleAddToCart(item.id)} style={styles.addButton}>
                                <Ionicons name="add" size={20} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                </View>
            );
          })}
        </View>

        {/* Bottom padding for floating button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Cart Button */}
      {totalPoints > 0 && (
        <View style={styles.floatingButtonContainer}>
            <TouchableOpacity style={styles.cartButton} onPress={handleCheckout}>
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
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    height: PARALLAX_HEADER_HEIGHT,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f6f6f6',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 8,
  },
  ratingText: {
      fontWeight: 'bold',
      marginLeft: 4,
      fontSize: 14,
  },
  metaText: {
      color: '#666',
      fontSize: 14,
  },

  // Menu
  menuContainer: {
      padding: 20,
  },
  menuTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      color: '#111',
  },
  menuItem: {
      flexDirection: 'row',
      marginBottom: 24,
      borderBottomWidth: 1,
      borderBottomColor: '#f9f9f9',
      paddingBottom: 24,
  },
  menuItemInfo: {
      flex: 1,
      paddingRight: 16,
      justifyContent: 'center',
  },
  itemName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#111',
      marginBottom: 4,
  },
  itemDescription: {
      fontSize: 14,
      color: '#666',
      marginBottom: 8,
      lineHeight: 20,
  },
  itemPrice: {
      fontSize: 15,
      fontWeight: 'bold',
      color: '#0a7ea4', // Brand color for points
  },
  rightSection: {
      alignItems: 'flex-end',
  },
  itemImage: {
      width: 100,
      height: 100,
      borderRadius: 12,
      backgroundColor: '#eee',
      marginBottom: 8,
  },
  qtyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 36,
  },
  addButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#000',
      justifyContent: 'center',
      alignItems: 'center',
  },
  qtyControls: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f0f0f0',
      borderRadius: 18,
      padding: 2,
  },
  qtyButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      elevation: 1,
  },
  qtyText: {
      marginHorizontal: 12,
      fontWeight: 'bold',
      fontSize: 14,
  },

  // Floating Button
  floatingButtonContainer: {
      position: 'absolute',
      bottom: 30,
      left: 20,
      right: 20,
  },
  cartButton: {
      backgroundColor: '#222',
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
      borderRadius: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
  },
  cartCountCircle: {
      backgroundColor: '#444',
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
