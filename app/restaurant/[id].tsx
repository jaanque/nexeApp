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
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem}>
              <View style={styles.menuItemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.description && (
                    <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
                )}
                <Text style={styles.itemPrice}>{item.price.toFixed(2)} €</Text>
              </View>
              {item.image_url && (
                  <Image source={{ uri: item.image_url }} style={styles.itemImage} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom padding for floating button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Cart Button */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity style={styles.cartButton}>
            <Text style={styles.cartButtonText}>Ver Carrito</Text>
            <Text style={styles.cartButtonPrice}>0.00 €</Text>
        </TouchableOpacity>
      </View>
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
      fontWeight: '600',
      color: '#111',
  },
  itemImage: {
      width: 100,
      height: 100,
      borderRadius: 12,
      backgroundColor: '#eee',
  },

  // Floating Button
  floatingButtonContainer: {
      position: 'absolute',
      bottom: 30,
      left: 20,
      right: 20,
  },
  cartButton: {
      backgroundColor: '#000',
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
      borderRadius: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
  },
  cartButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
  },
  cartButtonPrice: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
  },
});
