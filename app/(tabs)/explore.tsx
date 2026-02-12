import { View, StyleSheet, Text, FlatList, TouchableOpacity, ListRenderItem } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
// import { useEffect } from 'react';
// import { supabase } from '../../lib/supabase';

// Interface matching the database schema
interface Restaurant {
  id: number;
  name: string;
  image_url: string;
  rating: number;
  cuisine_type: string;
  delivery_time_min: number;
  delivery_time_max: number;
  delivery_fee: number;
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
    delivery_time_min: 20,
    delivery_time_max: 30,
    delivery_fee: 1.99,
    address: '123 Main St',
  },
  {
    id: 2,
    name: 'Sushi Master',
    image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
    rating: 4.8,
    cuisine_type: 'Japanese • Sushi',
    delivery_time_min: 30,
    delivery_time_max: 45,
    delivery_fee: 2.49,
    address: '456 Elm St',
  },
  {
    id: 3,
    name: 'Pizza Hut',
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
    rating: 4.2,
    cuisine_type: 'Italian • Pizza',
    delivery_time_min: 25,
    delivery_time_max: 40,
    delivery_fee: 0.00,
    address: '789 Oak St',
  },
  {
    id: 4,
    name: 'Taco Bell',
    image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
    rating: 4.0,
    cuisine_type: 'Mexican • Tacos',
    delivery_time_min: 15,
    delivery_time_max: 25,
    delivery_fee: 1.49,
    address: '101 Pine St',
  },
  {
    id: 5,
    name: 'Indian Spice',
    image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356f36?w=800&q=80',
    rating: 4.7,
    cuisine_type: 'Indian • Curry',
    delivery_time_min: 35,
    delivery_time_max: 50,
    delivery_fee: 2.99,
    address: '202 Maple St',
  },
  {
    id: 6,
    name: 'Healthy Greens',
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    rating: 4.6,
    cuisine_type: 'Healthy • Salads',
    delivery_time_min: 20,
    delivery_time_max: 35,
    delivery_fee: 1.99,
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
          <Text style={styles.name}>{restaurant.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{restaurant.rating}</Text>
          </View>
        </View>

        <Text style={styles.cuisine}>{restaurant.cuisine_type}</Text>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {restaurant.delivery_time_min}-{restaurant.delivery_time_max} min
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="bicycle-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {restaurant.delivery_fee === 0 ? 'Free' : `$${restaurant.delivery_fee.toFixed(2)}`}
            </Text>
          </View>
        </View>
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
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Restaurantes</Text>
      <FlatList
        data={restaurants}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginBottom: 10,
    color: '#333',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#eee',
  },
  infoContainer: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: '600',
    color: '#333',
    fontSize: 14,
  },
  cuisine: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    marginLeft: 4,
    color: '#666',
    fontSize: 14,
  },
});
