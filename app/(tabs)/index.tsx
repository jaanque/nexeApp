import { View, StyleSheet, Text, TextInput, ScrollView, TouchableOpacity, FlatList, ListRenderItem, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Interface matching the database schema
interface Restaurant {
  id: number;
  name: string;
  image_url: string;
  rating: number;
  cuisine_type: string;
  address: string;
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
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [hasClaimedWelcome, setHasClaimedWelcome] = useState<boolean>(true);
  const [claiming, setClaiming] = useState<boolean>(false);
  const [checkingClaim, setCheckingClaim] = useState<boolean>(true);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResultsRestaurants, setSearchResultsRestaurants] = useState<Restaurant[]>([]);
  const [searchResultsDishes, setSearchResultsDishes] = useState<MenuItemResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchPoints(session.user.id);
        checkWelcomeClaim(session.user.id);
      } else {
          setCheckingClaim(false);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchPoints(session.user.id);
        checkWelcomeClaim(session.user.id);
      } else {
          setCheckingClaim(false);
      }
    });

    fetchPopularRestaurants();
  }, []);

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 20) return 'Buenas tardes';
    return 'Buenas noches';
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
          // Search Restaurants
          const { data: restData } = await supabase
            .from('restaurants')
            .select('*')
            .ilike('name', `%${query}%`)
            .limit(5);

          if (restData) {
              setSearchResultsRestaurants(restData);
          }

          // Search Menu Items
          const { data: menuData } = await supabase
            .from('menu_items')
            .select('*, restaurants(name)')
            .ilike('name', `%${query}%`)
            .limit(10);

          if (menuData) {
              setSearchResultsDishes(menuData as any);
          }

      } catch (error) {
          console.error("Search error:", error);
      } finally {
          setSearching(false);
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

  async function checkWelcomeClaim(userId: string) {
    try {
      setCheckingClaim(true);
      const { data, error } = await supabase
        .from('welcome_gift_claims')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
         console.error('Error checking welcome claim:', error);
         setHasClaimedWelcome(true);
      } else {
         setHasClaimedWelcome(!!data);
      }
    } catch (error) {
      console.error('Unexpected error checking claim:', error);
      setHasClaimedWelcome(true);
    } finally {
        setCheckingClaim(false);
    }
  }

  async function handleClaimWelcome() {
    if (!session?.user || claiming) return;

    try {
        setClaiming(true);
        const userId = session.user.id;

        const { error: claimError } = await supabase
            .from('welcome_gift_claims')
            .insert({ user_id: userId });

        if (claimError) {
            console.error('Error inserting claim:', claimError);
            Alert.alert('Error', 'No se pudo reclamar el regalo. Inténtalo de nuevo.');
            setClaiming(false);
            return;
        }

        const newPoints = points + 5;
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ points: newPoints })
            .eq('id', userId);

        if (updateError) {
            console.error('Error updating points:', updateError);
             Alert.alert('Atención', 'Regalo registrado pero hubo un error actualizando los puntos.');
             setHasClaimedWelcome(true);
        } else {
            setPoints(newPoints);
            setHasClaimedWelcome(true);
            Alert.alert('¡Felicidades!', 'Has recibido tu regalo de bienvenida de 5 puntos.');
        }
    } catch (error) {
        console.error('Unexpected error claiming:', error);
        Alert.alert('Error', 'Ocurrió un error inesperado.');
    } finally {
        setClaiming(false);
    }
  }

  async function fetchPopularRestaurants() {
    try {
      setLoadingRestaurants(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .gte('rating', 4.5)
        .order('rating', { ascending: false })
        .limit(10);

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
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Header & Promo Wrapper */}
          <View style={[styles.purpleHeader, { paddingTop: insets.top + 10 }]}>
            <View style={styles.topBar}>
                {/* Search Bar (Replaces Location Text) */}
                <View style={styles.searchContainerInline}>
                    <Ionicons name="search" size={18} color="#111" style={styles.searchIcon} />
                    <TextInput
                        placeholder="Restaurantes, platos..."
                        placeholderTextColor="#666"
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                    {isSearching && (
                        <TouchableOpacity onPress={() => handleSearch("")}>
                            <Ionicons name="close-circle" size={18} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.rightHeader}>
                    {/* Points Pill (Same height/style as search) */}
                    <TouchableOpacity
                        onPress={() => session?.user ? router.push('/wallet') : router.push('/login')}
                        style={styles.pointsPill}
                    >
                        <Text style={[styles.pointsText, { color: '#fff' }]}>{points} pts</Text>
                        <IconSymbol size={16} name="star.fill" color="#FFD700" />
                    </TouchableOpacity>

                    {/* Profile Button (Same height/style as search/points) */}
                    <TouchableOpacity
                        onPress={() => session?.user ? router.push('/profile') : router.push('/login')}
                        style={styles.profileButton}
                    >
                        <Ionicons name="person-circle" size={40} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* New Banner Content within Header */}
            {!isSearching && (
                 <View style={styles.headerBannerContent}>
                     <Text style={styles.headerTitle}>
                        {session?.user ? getGreeting() + ', viajero' : getGreeting()}
                     </Text>
                     <Text style={styles.headerSubtitle}>
                        Encuentra lo que te hace feliz hoy
                     </Text>
                 </View>
            )}

            {/* Welcome Gift Banner (Moved UP) */}
             {!isSearching && !checkingClaim && !hasClaimedWelcome && session?.user && (
                 <View style={styles.promoContainer}>
                    <View style={styles.promoContent}>
                        <Text style={styles.promoTitle}>Regalo de Bienvenida</Text>
                        <Text style={styles.promoText}>Reclama tus 5 puntos gratis por unirte a nosotros.</Text>
                        <TouchableOpacity
                            style={styles.promoButton}
                            onPress={handleClaimWelcome}
                            disabled={claiming}
                        >
                            {claiming ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.promoButtonText}>Reclamar regalo</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                    <Image source={{ uri: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=2070&auto=format&fit=crop' }} style={styles.promoImage} contentFit="contain" />
                 </View>
             )}
          </View>

          {/* Categories */}
            {!isSearching && (
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
            )}

          {/* Search Results */}
          {isSearching ? (
              <View style={styles.sectionContainer}>
                  {searching ? (
                      <ActivityIndicator size="large" color="#000" style={{marginTop: 20}} />
                  ) : (
                      <>
                        <Text style={styles.sectionTitle}>Resultados</Text>

                        {/* Restaurants Matches */}
                        {searchResultsRestaurants.length > 0 && (
                            <View style={{marginBottom: 20}}>
                                <Text style={[styles.sectionTitle, {fontSize: 16, marginBottom: 10}]}>Restaurantes</Text>
                                {searchResultsRestaurants.map(item => (
                                    <VerticalRestaurantCard key={`rest-${item.id}`} restaurant={item} />
                                ))}
                            </View>
                        )}

                        {/* Dish Matches */}
                        {searchResultsDishes.length > 0 && (
                            <View>
                                <Text style={[styles.sectionTitle, {fontSize: 16, marginBottom: 10}]}>Platos</Text>
                                {searchResultsDishes.map(item => (
                                    <DishResultCard key={`dish-${item.id}`} item={item} />
                                ))}
                            </View>
                        )}

                        {searchResultsRestaurants.length === 0 && searchResultsDishes.length === 0 && (
                            <Text style={{textAlign: 'center', marginTop: 20, color: '#666'}}>No se encontraron resultados.</Text>
                        )}
                      </>
                  )}
              </View>
          ) : (
              <>
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
              </>
          )}

        </ScrollView>
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

function DishResultCard({ item }: { item: MenuItemResult }) {
    const router = useRouter();
    return (
        <TouchableOpacity
            style={styles.dishCard}
            onPress={() => router.push(`/restaurant/${item.restaurant_id}`)}
        >
            <Image source={{ uri: item.image_url }} style={styles.dishImage} contentFit="cover" />
            <View style={{flex: 1}}>
                <Text style={styles.dishName}>{item.name}</Text>
                <Text style={styles.dishRestName}>{item.restaurants?.name}</Text>
                <Text style={styles.dishPrice}>${item.price}</Text>
            </View>
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
  purpleHeader: {
      backgroundColor: '#540B48', // Deep Purple
      paddingHorizontal: 16,
      paddingBottom: 60, // Increased height significantly
      // Removed rounded borders as requested
  },
  headerBannerContent: {
      marginTop: 10,
      marginBottom: 10,
  },
  headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 4,
  },
  headerSubtitle: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.8)',
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
      marginBottom: 10, // Less bottom margin as promo follows
  },
  rightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 10, // Space between search and icons
  },
  pointsPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 10,
      borderRadius: 12, // Match search bar radius
      marginRight: 10,
      height: 40, // Match search bar height
  },
  profileButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 0,
      height: 40, // Match search bar height
      width: 40, // Square/Circular aspect
      justifyContent: 'center',
  },
  pointsText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#fff',
      marginRight: 4,
  },

  // Inline Search Bar (In Header)
  searchContainerInline: {
    flex: 1, // Take available space
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12, // Less circular, more squared-rounded
    paddingHorizontal: 12,
    height: 40, // Fixed height for alignment
    // shadowColor: '#000', // Removed shadow for flat look in header
  },
  searchIcon: {
      marginRight: 8,
  },
  searchInput: {
      flex: 1,
      fontSize: 16,
      color: '#000',
      fontWeight: '500',
  },

  // Categories
  categoryContainer: {
      marginBottom: 24, // Increased spacing below categories
      marginTop: 20, // Increased spacing above categories
  },
  categoryContent: {
      paddingRight: 20,
      paddingLeft: 20, // Increased horizontal padding
      gap: 10, // Added gap between items if supported (React Native 0.71+) or use marginRight
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

  // Promo Banner (Styled to match Image)
  promoContainer: {
      flexDirection: 'row',
      // backgroundColor removed, inherits purple
      paddingVertical: 10,
      marginBottom: 20,
      height: 140,
      position: 'relative',
  },
  promoContent: {
      flex: 1,
      zIndex: 2,
      justifyContent: 'center',
      paddingRight: 20,
  },
  promoTitle: {
      color: '#fff',
      fontSize: 22, // Larger
      fontWeight: 'bold',
      marginBottom: 4,
  },
  promoText: {
      color: '#fff', // White
      fontSize: 14,
      marginBottom: 16,
      opacity: 0.9,
  },
  promoButton: {
      backgroundColor: '#000', // Black button
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      alignSelf: 'flex-start',
  },
  promoButtonText: {
      color: '#fff', // White text
      fontSize: 14,
      fontWeight: 'bold',
  },
  promoImage: {
      width: 120,
      height: 120,
      // Position it nicely
  },

  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  // Sections
  sectionContainer: {
      marginBottom: 24,
      paddingHorizontal: 16,
  },
  sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
  },
  sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#000',
      marginBottom: 12,
  },
  carouselContent: {
      paddingRight: 10,
  },
  verticalList: {
      // paddingHorizontal: 16,
  },

  // Dish Card (Search Result)
  dishCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      backgroundColor: '#fff',
  },
  dishImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 12,
      backgroundColor: '#f0f0f0',
  },
  dishName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#000',
  },
  dishRestName: {
      fontSize: 12,
      color: '#666',
      marginBottom: 2,
  },
  dishPrice: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
  },

  // Horizontal Card Styles
  cardHorizontal: {
      width: 280, // Slightly wider
      marginRight: 16, // Increased spacing
      backgroundColor: '#fff',
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3, // Android shadow
      paddingBottom: 12, // Space for content
      marginBottom: 4, // Space for shadow
  },
  cardImageHorizontal: {
      width: '100%',
      height: 160, // Taller image
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      marginBottom: 8,
      backgroundColor: '#f0f0f0',
  },
  cardContentHorizontal: {
      paddingHorizontal: 12, // Added padding inside card
  },

  // Vertical Card Styles
  cardVertical: {
      width: '100%',
      marginBottom: 24,
      backgroundColor: '#fff',
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4, // Android shadow
      overflow: 'visible', // Allow shadow
  },
  cardImageVertical: {
      width: '100%',
      height: 220, // Even larger image for impact
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      marginBottom: 0, // No margin, content follows directly
      backgroundColor: '#f0f0f0',
  },
  cardContentVertical: {
      paddingHorizontal: 16,
      paddingVertical: 16,
  },

  // Shared Card Elements
  rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
  },
  cardTitle: {
      fontSize: 16,
      fontWeight: '700', // Stronger font weight
      color: '#1a1a1a', // Softer black
      flex: 1,
  },
  cardTitleLarge: {
      fontSize: 20, // Larger title
      fontWeight: '700',
      color: '#1a1a1a',
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
