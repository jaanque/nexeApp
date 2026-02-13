import { View, StyleSheet, Button, Text, TextInput, ScrollView, TouchableOpacity, FlatList, ListRenderItem } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

// Interface matching the database schema
interface Restaurant {
  id: number;
  name: string;
  image_url: string;
  rating: number;
  cuisine_type: string;
  address: string;
}

const mockPopularRestaurants: Restaurant[] = [
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

export default function HomeScreen() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [popularRestaurants, setPopularRestaurants] = useState<Restaurant[]>(mockPopularRestaurants);

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

    fetchPopularRestaurants();
  }, []);

  async function fetchPoints(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching points:', error);
      } else if (data) {
        setPoints(data.points || 0);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  }

  async function fetchPopularRestaurants() {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .gte('rating', 4.5) // Example filter for popular
        .order('rating', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching restaurants:', error);
      } else if (data && data.length > 0) {
        setPopularRestaurants(data);
      }
    } catch (error) {
       // Fallback to mock data if fetch fails
       console.log("Using mock data due to error", error);
    }
  }

  const username = session?.user?.user_metadata?.username || session?.user?.email?.split('@')[0] || "Usuario";

  const renderRestaurantItem: ListRenderItem<Restaurant> = ({ item }) => (
      <HorizontalRestaurantCard restaurant={item} />
  );

  return (
    <View style={styles.container}>
      {session && session.user ? (
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.headerContainer}>
            <View style={styles.topBar}>
                <View>
                    <Text style={styles.greetingText}>Hola, {username}</Text>
                </View>
                <View style={styles.pointsPill}>
                    <Text style={styles.pointsText}>{points} pts</Text>
                    <IconSymbol size={16} name="star.fill" color="#FFD700" />
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#111" style={styles.searchIcon} />
                <TextInput
                placeholder="Buscar en NexeApp"
                placeholderTextColor="#666"
                style={styles.searchInput}
                />
            </View>

            {/* Filter Bar */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
                    <FilterItem label="Per emportar" icon="bag-handle-outline" />
                    <FilterItem label="Ofertes flash" icon="flash-outline" />
                    <FilterItem label="Bescanviar" icon="swap-horizontal-outline" />
                    <FilterItem label="Regalar punts" icon="gift-outline" />
                    <FilterItem label="Ruleta" icon="color-wand-outline" />
                    <FilterItem label="Mapa" icon="map-outline" />
                </ScrollView>
            </View>
          </View>

          {/* Popular Restaurants Carousel */}
          <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Restaurantes Populares</Text>
              <FlatList
                  data={popularRestaurants}
                  renderItem={renderRestaurantItem}
                  keyExtractor={(item) => item.id.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carouselContent}
              />
          </View>

        </ScrollView>
      ) : (
        <View style={styles.centerContent}>
            <Text style={styles.welcomeText}>Welcome to NexeApp</Text>
        </View>
      )}
    </View>
  );
}

function FilterItem({ label, icon }: { label: string, icon: any }) {
    return (
        <TouchableOpacity style={styles.filterItem}>
             <Ionicons name={icon} size={18} color="#111" />
            <Text style={styles.filterText}>{label}</Text>
        </TouchableOpacity>
    );
}

function HorizontalRestaurantCard({ restaurant }: { restaurant: Restaurant }) {
    return (
        <TouchableOpacity style={styles.card} activeOpacity={0.8}>
            <Image
                source={{ uri: restaurant.image_url }}
                style={styles.cardImage}
                contentFit="cover"
                transition={200}
            />
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{restaurant.name}</Text>
                    <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>{restaurant.rating}</Text>
                    </View>
                </View>
                <Text style={styles.cardSubtitle} numberOfLines={1}>{restaurant.cuisine_type}</Text>
                <View style={styles.deliveryInfo}>
                    <Text style={styles.deliveryText}>15-25 min • Gratis</Text>
                </View>
            </View>
             <View style={styles.favoriteButton}>
                <Ionicons name="heart-outline" size={16} color="#fff" />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
      flex: 1,
  },
  headerContainer: {
      paddingTop: 60, // Safe area padding replacement
      paddingHorizontal: 20,
      paddingBottom: 10,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  pointsPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#eee',
  },
  pointsText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
      marginRight: 6,
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6f6f6',
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchIcon: {
      marginRight: 10,
  },
  searchInput: {
      flex: 1,
      fontSize: 16,
      color: '#111',
      fontWeight: '500',
  },

  // Filter Bar
  filterContainer: {
      height: 40,
      marginBottom: 10,
  },
  filterContent: {
      paddingRight: 0,
  },
  filterItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f6f6f6',
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 10,
  },
  filterText: {
      fontWeight: '600',
      fontSize: 13,
      color: '#111',
      marginLeft: 6,
  },

  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  // Popular Section
  sectionContainer: {
      marginTop: 20,
      marginBottom: 40,
  },
  sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 15,
      marginLeft: 20,
      color: '#222',
  },
  carouselContent: {
      paddingHorizontal: 20,
      paddingRight: 10, // Adjust for last item margin
  },

  // Card Styles
  card: {
      width: 260,
      marginRight: 15,
      backgroundColor: '#fff',
      // No shadow for cleaner look, purely image based? or minimal
  },
  cardImage: {
      width: '100%',
      height: 160,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor: '#eee',
  },
  cardContent: {
      paddingHorizontal: 4,
  },
  cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
  },
  cardTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#111',
      flex: 1,
  },
  ratingBadge: {
      backgroundColor: '#eee',
      borderRadius: 12,
      paddingHorizontal: 6,
      paddingVertical: 2,
      minWidth: 24,
      alignItems: 'center',
  },
  ratingText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#111',
  },
  cardSubtitle: {
      fontSize: 14,
      color: '#666',
      marginBottom: 4,
  },
  deliveryInfo: {
      flexDirection: 'row',
  },
  deliveryText: {
      fontSize: 12,
      color: '#666',
  },
  favoriteButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: 20,
      padding: 6,
  },
});
