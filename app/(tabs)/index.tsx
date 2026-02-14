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
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        stickyHeaderIndices={[0]} // Optional: Make header sticky if preferred, but let's stick to standard flow first. Actually, standard Postmates has sticky search. Let's not complicate sticky indices yet.
      >
          {/* New Clean Header */}
          <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
            <View style={styles.headerTopRow}>
                <View style={styles.addressWrapper}>
                    <Text style={styles.deliveryLabel}>Entregar en</Text>
                    <View style={styles.addressRow}>
                        <Text style={styles.addressText}>Casa</Text>
                        <IconSymbol name="chevron.down" size={14} color="#000" style={{marginLeft: 4, marginTop: 2}} />
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => session?.user ? router.push('/profile') : router.push('/login')}
                    style={styles.profileButton}
                >
                    <IconSymbol name="person.circle" size={32} color="#000" />
                </TouchableOpacity>
            </View>

            <View style={styles.searchWrapper}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#000" style={styles.searchIcon} />
                    <TextInput
                        placeholder="Buscar..."
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
            </View>
          </View>

          {/* Welcome Gift Banner (Styled as dark card) */}
             {!isSearching && !checkingClaim && !hasClaimedWelcome && session?.user && (
                 <View style={styles.promoPadding}>
                    <View style={styles.promoContainer}>
                        <View style={styles.promoContent}>
                            <Text style={styles.promoTitle}>Regalo de Bienvenida</Text>
                            <Text style={styles.promoText}>5 puntos gratis por unirte.</Text>
                            <TouchableOpacity
                                style={styles.promoButton}
                                onPress={handleClaimWelcome}
                                disabled={claiming}
                            >
                                {claiming ? (
                                    <ActivityIndicator size="small" color="#000" />
                                ) : (
                                    <Text style={styles.promoButtonText}>Reclamar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                        <Image source={{ uri: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=2070&auto=format&fit=crop' }} style={styles.promoImage} contentFit="contain" />
                    </View>
                 </View>
             )}

          {/* Categories */}
            {!isSearching && (
                <View style={styles.categoryContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContent}>
                        <CategoryItem label="Hamburguesas" icon="fast-food" />
                        <CategoryItem label="Pizza" icon="pizza" />
                        <CategoryItem label="Asiática" icon="restaurant" />
                        <CategoryItem label="Postres" icon="ice-cream" />
                        <CategoryItem label="Bebidas" icon="wine" />
                        <CategoryItem label="Envíos" icon="bicycle" />
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
                             <IconSymbol name="arrow.right" size={20} color="#000" />
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

function CategoryItem({ label, icon }: { label: string, icon: any }) {
    return (
        <TouchableOpacity style={styles.categoryItem}>
            <View style={styles.categoryIconContainer}>
                <IconSymbol name={icon} size={30} color="#000" />
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
            <View style={styles.imageContainerHorizontal}>
                <Image
                    source={{ uri: restaurant.image_url }}
                    style={styles.cardImageHorizontal}
                    contentFit="cover"
                    transition={200}
                />
                <View style={styles.heartButton}>
                    <Ionicons name="heart-outline" size={20} color="#fff" />
                </View>
                <View style={styles.ratingBadgeOverImage}>
                    <Text style={styles.ratingTextOverImage}>{restaurant.rating}</Text>
                </View>
            </View>

            <View style={styles.cardContentHorizontal}>
                <Text style={styles.cardTitle} numberOfLines={1}>{restaurant.name}</Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                    $ • {restaurant.cuisine_type}
                </Text>
                <Text style={styles.deliveryText}>
                    <Ionicons name="time-outline" size={12} color="#666" /> 15-25 min • Envío gratis
                </Text>
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
             <View style={styles.imageContainerVertical}>
                <Image
                    source={{ uri: restaurant.image_url }}
                    style={styles.cardImageVertical}
                    contentFit="cover"
                    transition={200}
                />
                <View style={styles.heartButton}>
                    <Ionicons name="heart-outline" size={20} color="#fff" />
                </View>
                 <View style={styles.ratingBadgeOverImage}>
                    <Text style={styles.ratingTextOverImage}>{restaurant.rating}</Text>
                </View>
            </View>

            <View style={styles.cardContentVertical}>
                <View style={styles.rowBetween}>
                    <Text style={styles.cardTitleLarge} numberOfLines={1}>{restaurant.name}</Text>
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

  // Header
  headerContainer: {
      backgroundColor: '#fff',
      paddingBottom: 10,
      paddingHorizontal: 16,
      borderBottomWidth: 0,
      // shadowColor: '#000',
      // shadowOpacity: 0.05,
      // shadowRadius: 5,
      // elevation: 2,
      zIndex: 10,
  },
  headerTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
  },
  addressWrapper: {
      flex: 1,
  },
  deliveryLabel: {
      fontSize: 12,
      color: '#666',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 2,
  },
  addressRow: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  addressText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#000',
  },
  profileButton: {
      padding: 4,
  },

  // Search
  searchWrapper: {
      width: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F3F3', // Light gray background
    borderRadius: 25, // Pill shape
    paddingHorizontal: 16,
    height: 50,
  },
  searchIcon: {
      marginRight: 10,
  },
  searchInput: {
      flex: 1,
      fontSize: 16,
      color: '#000',
      fontWeight: '500',
  },

  // Categories
  categoryContainer: {
      marginVertical: 20,
  },
  categoryContent: {
      paddingHorizontal: 16,
      paddingRight: 16,
  },
  categoryItem: {
      alignItems: 'center',
      marginRight: 24,
      width: 70,
  },
  categoryIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 8, // Square with rounded corners or just remove bg
      // backgroundColor: '#F3F3F3', // Optional: very subtle background
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
  },
  categoryText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#000',
      textAlign: 'center',
  },

  // Promo Banner
  promoPadding: {
      paddingHorizontal: 16,
      marginBottom: 20,
  },
  promoContainer: {
      flexDirection: 'row',
      backgroundColor: '#111', // Black background for contrast
      borderRadius: 12,
      padding: 16,
      height: 140,
      position: 'relative',
      overflow: 'hidden',
  },
  promoContent: {
      flex: 1,
      zIndex: 2,
      justifyContent: 'center',
      paddingRight: 10,
  },
  promoTitle: {
      color: '#fff',
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 4,
  },
  promoText: {
      color: '#ccc',
      fontSize: 13,
      marginBottom: 16,
  },
  promoButton: {
      backgroundColor: '#fff',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      alignSelf: 'flex-start',
  },
  promoButtonText: {
      color: '#000',
      fontSize: 13,
      fontWeight: 'bold',
  },
  promoImage: {
      width: 120,
      height: 120,
      position: 'absolute',
      right: -20,
      bottom: -20,
      transform: [{ rotate: '-10deg' }],
  },

  // Sections
  sectionContainer: {
      marginBottom: 30,
      paddingHorizontal: 16,
  },
  sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
  },
  sectionTitle: {
      fontSize: 20, // Clean bold title
      fontWeight: '700',
      color: '#000',
  },
  carouselContent: {
      paddingRight: 16,
  },
  verticalList: {
      // paddingHorizontal: 16,
  },

  // Dish Card
  dishCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
      paddingBottom: 16,
  },
  dishImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
      marginRight: 16,
      backgroundColor: '#f0f0f0',
  },
  dishName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#000',
      marginBottom: 4,
  },
  dishRestName: {
      fontSize: 12,
      color: '#666',
      marginBottom: 4,
  },
  dishPrice: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
  },

  // Horizontal Card
  cardHorizontal: {
      width: 260,
      marginRight: 16,
      backgroundColor: '#fff',
      // No shadow/elevation for cleaner look
      marginBottom: 4,
  },
  imageContainerHorizontal: {
      position: 'relative',
      marginBottom: 10,
  },
  cardImageHorizontal: {
      width: '100%',
      height: 150,
      borderRadius: 12, // Rounded corners
      backgroundColor: '#f0f0f0',
  },
  cardContentHorizontal: {
      paddingHorizontal: 0,
  },

  // Vertical Card
  cardVertical: {
      width: '100%',
      marginBottom: 30,
      backgroundColor: '#fff',
  },
  imageContainerVertical: {
      position: 'relative',
      marginBottom: 12,
  },
  cardImageVertical: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      backgroundColor: '#f0f0f0',
  },
  cardContentVertical: {
      paddingHorizontal: 0,
  },

  // Shared
  rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
  },
  cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#000',
      marginBottom: 2,
  },
  cardTitleLarge: {
      fontSize: 18,
      fontWeight: '700',
      color: '#000',
      flex: 1,
  },
  cardSubtitle: {
      fontSize: 14,
      color: '#666',
      marginBottom: 4,
  },
  deliveryText: {
      fontSize: 12,
      color: '#666',
  },
  heartButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: 20,
      padding: 6,
  },
  ratingBadgeOverImage: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
  },
  ratingTextOverImage: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#000',
  },
});
