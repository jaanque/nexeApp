import { View, StyleSheet, Text, TextInput, ScrollView, TouchableOpacity, FlatList, ListRenderItem, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';

// Interface matching the database schema
interface Restaurant {
  id: number;
  name: string;
  image_url: string;
  rating: number;
  cuisine_type: string;
  address: string;
}

export default function HomeScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [popularRestaurants, setPopularRestaurants] = useState<Restaurant[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [locationText, setLocationText] = useState<string>("Cargando ubicación...");

  const router = useRouter();

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
    fetchLocation();
  }, []);

  async function fetchLocation() {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationText('Ubicación desconocida');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      let address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (address && address.length > 0) {
        const item = address[0];
        // Construct string: City, Subregion (Comarca), Region (Comunidad)
        // Note: Field availability depends on provider.
        const parts = [
            item.city,
            item.subregion, // Often maps to county/district
            item.region // Often maps to state/province/community
        ].filter(Boolean);

        if (parts.length > 0) {
            setLocationText(parts.join(', '));
        } else {
            setLocationText('Ubicación desconocida');
        }
      }
    } catch (error) {
      console.log('Error fetching location:', error);
      setLocationText('Ubicación no disponible');
    }
  }

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
      setLoadingRestaurants(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .gte('rating', 4.5) // Example filter for popular
        .order('rating', { ascending: false })
        .limit(10); // Fetch more for vertical list

      if (error) {
        console.error('Error fetching restaurants:', error);
        setPopularRestaurants([]);
      } else if (data && data.length > 0) {
        setPopularRestaurants(data);
      }
    } catch (error) {
       console.error("Error fetching popular restaurants", error);
       setPopularRestaurants([]);
    } finally {
        setLoadingRestaurants(false);
    }
  }

  const renderHorizontalRestaurantItem: ListRenderItem<Restaurant> = ({ item }) => (
      <HorizontalRestaurantCard restaurant={item} />
  );

  return (
    <View style={styles.container}>
      {session && session.user ? (
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={styles.headerContainer}>
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.locationContainer} activeOpacity={0.7}>
                    <View style={{ flex: 1, marginRight: 10, flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.greetingText} numberOfLines={1}>{locationText}</Text>
                        <IconSymbol size={16} name="chevron.down" color="#333" style={{ marginLeft: 4, marginTop: 2 }} />
                    </View>
                </TouchableOpacity>
                <View style={styles.rightHeader}>
                    {/* Points Pill removed or styled differently? Keeping it as pill for now but black/white */}
                    <TouchableOpacity onPress={() => router.push('/wallet')} style={styles.pointsPill}>
                        <Text style={styles.pointsText}>{points} pts</Text>
                        <IconSymbol size={16} name="star.fill" color="#000" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/profile')} style={styles.profileButton}>
                        <Ionicons name="person-circle" size={36} color="#000" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#111" style={styles.searchIcon} />
                <TextInput
                placeholder="Comida, restaurantes, bebidas..."
                placeholderTextColor="#666"
                style={styles.searchInput}
                />
            </View>

            {/* Categories */}
            <View style={styles.categoryContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContent}>
                    <CategoryItem label="Hamburguesas" icon="fast-food" color="#FFF3E0" iconColor="#FF9800" />
                    <CategoryItem label="Pizza" icon="pizza" color="#FFEBEE" iconColor="#F44336" />
                    <CategoryItem label="Asiática" icon="restaurant" color="#E8F5E9" iconColor="#4CAF50" />
                    <CategoryItem label="Postres" icon="ice-cream" color="#E3F2FD" iconColor="#2196F3" />
                    <CategoryItem label="Bebidas" icon="wine" color="#F3E5F5" iconColor="#9C27B0" />
                    <CategoryItem label="Envíos" icon="bicycle" color="#FAFAFA" iconColor="#666" />
                </ScrollView>
            </View>

             {/* Promo Banner */}
             <View style={styles.promoContainer}>
                <View style={styles.promoContent}>
                    <Text style={styles.promoTitle}>Oferta de bienvenida</Text>
                    <Text style={styles.promoText}>50% de descuento en tus primeros 3 pedidos.</Text>
                    <TouchableOpacity style={styles.promoButton}>
                        <Text style={styles.promoButtonText}>Pedir ahora</Text>
                    </TouchableOpacity>
                </View>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop' }} style={styles.promoImage} contentFit="cover" />
             </View>
          </View>


          {/* Popular Restaurants Horizontal */}
          <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Favoritos cerca de ti</Text>
                <TouchableOpacity>
                    <IconSymbol name="chevron.right" size={20} color="#000" />
                </TouchableOpacity>
              </View>
              {loadingRestaurants ? (
                  <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />
              ) : popularRestaurants.length > 0 ? (
                  <FlatList
                      data={popularRestaurants}
                      renderItem={renderHorizontalRestaurantItem}
                      keyExtractor={(item) => item.id.toString()}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.carouselContent}
                  />
              ) : (
                  <Text style={{ marginLeft: 20, color: '#666' }}>No hay restaurantes populares.</Text>
              )}
          </View>

          {/* All Restaurants Vertical */}
          <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Todos los restaurantes</Text>
               {loadingRestaurants ? (
                  <ActivityIndicator size="large" color="#000" />
              ) : popularRestaurants.length > 0 ? (
                  <View style={styles.verticalList}>
                      {popularRestaurants.map((restaurant) => (
                          <VerticalRestaurantCard key={restaurant.id} restaurant={restaurant} />
                      ))}
                  </View>
              ) : null}
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

function CategoryItem({ label, icon, color, iconColor }: { label: string, icon: any, color: string, iconColor: string }) {
    return (
        <TouchableOpacity style={styles.categoryItem}>
            <View style={[styles.categoryIconContainer, { backgroundColor: color }]}>
                <IconSymbol name={icon} size={28} color={iconColor} />
            </View>
            <Text style={styles.categoryText}>{label}</Text>
        </TouchableOpacity>
    );
}

function HorizontalRestaurantCard({ restaurant }: { restaurant: Restaurant }) {
    const router = useRouter();
    return (
        <TouchableOpacity
            style={styles.cardHorizontal}
            activeOpacity={0.9}
            onPress={() => router.push(`/restaurant/${restaurant.id}`)}
        >
            <Image
                source={{ uri: restaurant.image_url }}
                style={styles.cardImageHorizontal}
                contentFit="cover"
                transition={200}
            />
            <View style={styles.favoriteButton}>
                <Ionicons name="heart-outline" size={20} color="#fff" />
            </View>
            <View style={styles.cardContentHorizontal}>
                <View style={styles.rowBetween}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{restaurant.name}</Text>
                    <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>{restaurant.rating}</Text>
                    </View>
                </View>
                <Text style={styles.cardSubtitle} numberOfLines={1}>$ • {restaurant.cuisine_type}</Text>
                <Text style={styles.deliveryText}>15-25 min • Envío gratis</Text>
            </View>
        </TouchableOpacity>
    );
}

function VerticalRestaurantCard({ restaurant }: { restaurant: Restaurant }) {
    const router = useRouter();
    return (
        <TouchableOpacity
            style={styles.cardVertical}
            activeOpacity={0.9}
            onPress={() => router.push(`/restaurant/${restaurant.id}`)}
        >
             <Image
                source={{ uri: restaurant.image_url }}
                style={styles.cardImageVertical}
                contentFit="cover"
                transition={200}
            />
            <View style={styles.favoriteButton}>
                <Ionicons name="heart-outline" size={20} color="#fff" />
            </View>
            <View style={styles.cardContentVertical}>
                 <View style={styles.rowBetween}>
                    <Text style={styles.cardTitleLarge} numberOfLines={1}>{restaurant.name}</Text>
                    <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>{restaurant.rating}</Text>
                    </View>
                </View>
                <Text style={styles.cardSubtitle} numberOfLines={1}>$$ • {restaurant.cuisine_type} • 1.2 km</Text>
                <Text style={styles.deliveryText}>20-30 min • $1.49 envío</Text>
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
      paddingHorizontal: 16,
      paddingBottom: 10,
      backgroundColor: '#fff',
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
      marginBottom: 16,
  },
  locationContainer: {
      flex: 1,
  },
  rightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  greetingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  pointsPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f2f2f2',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      marginRight: 10,
  },
  profileButton: {
      padding: 0,
  },
  pointsText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#000',
      marginRight: 4,
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 12, // More square-ish like Uber
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  searchIcon: {
      marginRight: 12,
  },
  searchInput: {
      flex: 1,
      fontSize: 16,
      color: '#000',
      fontWeight: '500',
  },

  // Categories
  categoryContainer: {
      marginBottom: 24,
  },
  categoryContent: {
      paddingRight: 16,
  },
  categoryItem: {
      alignItems: 'center',
      marginRight: 20,
      width: 60,
  },
  categoryIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
  },
  categoryText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#333',
      textAlign: 'center',
  },

  // Promo Banner
  promoContainer: {
      flexDirection: 'row',
      backgroundColor: '#000', // Or brand color
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
      height: 140,
      overflow: 'hidden',
      position: 'relative',
  },
  promoContent: {
      flex: 1,
      zIndex: 2,
      justifyContent: 'center',
  },
  promoTitle: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 4,
  },
  promoText: {
      color: '#ddd',
      fontSize: 12,
      marginBottom: 12,
      width: '80%',
  },
  promoButton: {
      backgroundColor: '#fff',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      alignSelf: 'flex-start',
  },
  promoButtonText: {
      color: '#000',
      fontSize: 12,
      fontWeight: 'bold',
  },
  promoImage: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: '50%',
      opacity: 0.8,
  },

  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  // Sections
  sectionContainer: {
      marginBottom: 24,
  },
  sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingHorizontal: 16,
  },
  sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#000',
      paddingHorizontal: 16, // If not using sectionHeader
      marginBottom: 12, // If not using sectionHeader
  },
  carouselContent: {
      paddingHorizontal: 16,
  },
  verticalList: {
      paddingHorizontal: 16,
  },

  // Horizontal Card Styles
  cardHorizontal: {
      width: 280, // Slightly wider
      marginRight: 12,
      backgroundColor: '#fff',
  },
  cardImageHorizontal: {
      width: '100%',
      height: 160, // Taller image
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor: '#f0f0f0',
  },
  cardContentHorizontal: {
      paddingHorizontal: 0, // Align with image
  },

  // Vertical Card Styles
  cardVertical: {
      width: '100%',
      marginBottom: 24,
      backgroundColor: '#fff',
  },
  cardImageVertical: {
      width: '100%',
      height: 200, // Large banner image
      borderRadius: 12,
      marginBottom: 10,
      backgroundColor: '#f0f0f0',
  },
  cardContentVertical: {
      paddingHorizontal: 0,
  },

  // Shared Card Elements
  rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
  },
  cardTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#000',
      flex: 1,
  },
  cardTitleLarge: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#000',
      flex: 1,
  },
  ratingBadge: {
      backgroundColor: '#f2f2f2',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      minWidth: 28,
      alignItems: 'center',
  },
  ratingText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#000',
  },
  cardSubtitle: {
      fontSize: 14,
      color: '#666',
      marginBottom: 2,
  },
  deliveryText: {
      fontSize: 12,
      color: '#666',
  },
  favoriteButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: 'rgba(0,0,0,0.4)', // Slightly darker
      borderRadius: 20,
      padding: 6,
      zIndex: 1,
  },
});
