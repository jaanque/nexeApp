import { View, StyleSheet, Text, FlatList, TouchableOpacity, ListRenderItem } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { useEffect } from 'react';
// import { supabase } from '../../lib/supabase';

// Interface matching the database schema
interface Restaurant {
  id: number;
  name: string;
  image_url: string;
  rating: number;
  cuisine_type: string;
  address: string;
}

// Mock data matching the SQL inserts
const mockRestaurants: Restaurant[] = [
  {
    id: 1,
    name: 'Burger King',
    image_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80',
    rating: 4.5,
    cuisine_type: 'American • Burgers',
    address: '123 Main St',
  },
  {
    id: 2,
    name: 'Sushi Master',
    image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
    rating: 4.8,
    cuisine_type: 'Japanese • Sushi',
    address: '456 Elm St',
  },
  {
    id: 3,
    name: 'Pizza Hut',
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
    rating: 4.2,
    cuisine_type: 'Italian • Pizza',
    address: '789 Oak St',
  },
  {
    id: 4,
    name: 'Taco Bell',
    image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
    rating: 4.0,
    cuisine_type: 'Mexican • Tacos',
    address: '101 Pine St',
  },
  {
    id: 5,
    name: 'Indian Spice',
    image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356f36?w=800&q=80',
    rating: 4.7,
    cuisine_type: 'Indian • Curry',
    address: '202 Maple St',
  },
  {
    id: 6,
    name: 'Healthy Greens',
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    rating: 4.6,
    cuisine_type: 'Healthy • Salads',
    address: '303 Birch St',
  },
];

const RestaurantCard = ({ restaurant }: { restaurant: Restaurant }) => {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <Image
        source={{ uri: restaurant.image_url }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.infoContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{restaurant.rating}</Text>
          </View>
        </View>

        <Text style={styles.cuisine} numberOfLines={1}>{restaurant.cuisine_type}</Text>

        {/* Delivery details removed */}
      </View>
    </TouchableOpacity>
  );
};

export default function ExploreScreen() {
  const [restaurants] = useState<Restaurant[]>(mockRestaurants);

  // Example of how to fetch data from Supabase:
  /*
  useEffect(() => {
    fetchRestaurants();
  }, []);

  async function fetchRestaurants() {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('id');

      if (error) {
        console.error('Error fetching restaurants:', error);
      } else if (data) {
        setRestaurants(data);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  }
  */

  const renderItem: ListRenderItem<Restaurant> = ({ item }) => (
    <RestaurantCard restaurant={item} />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.headerTitle}>Restaurantes</Text>
      <FlatList
        data={restaurants}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
    color: '#333',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Extra padding to clear the bottom tab bar
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16, // Slightly more rounded
    marginBottom: 20, // More spacing between cards
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, // Deeper shadow
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0', // Subtle border
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#eee',
  },
  infoContainer: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: '700',
    color: '#333',
    fontSize: 14,
  },
  cuisine: {
    color: '#666',
    fontSize: 14,
    marginBottom: 0, // Reduced margin since delivery info is removed
  },
});
