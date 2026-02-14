import { View, StyleSheet, Text, TextInput, ScrollView, TouchableOpacity, FlatList, ListRenderItem, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';

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
  const [rewardItems, setRewardItems] = useState<MenuItemResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState<{ [key: number]: number }>({});

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResultsRestaurants, setSearchResultsRestaurants] = useState<Restaurant[]>([]);
  const [searchResultsDishes, setSearchResultsDishes] = useState<MenuItemResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);

  // Filter State
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const router = useRouter();
  const insets = useSafeAreaInsets();

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

    fetchData();
  }, []);

  function handlePress(action: () => void) {
      if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      action();
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
          const { data: restData } = await supabase
            .from('restaurants')
            .select('*')
            .ilike('name', `%${query}%`)
            .limit(5);

          if (restData) setSearchResultsRestaurants(restData);

          const { data: menuData } = await supabase
            .from('menu_items')
            .select('*, restaurants(name)')
            .ilike('name', `%${query}%`)
            .limit(10);

          if (menuData) setSearchResultsDishes(menuData as any);

      } catch (error) {
          console.error("Search error:", error);
      } finally {
          setSearching(false);
      }
  }

  async function fetchPoints(userId: string) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();
      if (data) setPoints(data.points || 0);
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  }

  async function fetchData() {
    try {
      setLoading(true);
      // Fetch popular restaurants
      const { data: restData } = await supabase
        .from('restaurants')
        .select('*')
        .gte('rating', 4.5)
        .order('rating', { ascending: false })
        .limit(10);

      if (restData) setPopularRestaurants(restData);

      // Fetch reward items (menu items)
      // Since we don't have a "rewards" flag, we'll just take some items
      const { data: menuData } = await supabase
        .from('menu_items')
        .select('*, restaurants(name)')
        .limit(10);

      if (menuData) setRewardItems(menuData as any);

    } catch (error) {
       console.error("Error fetching data", error);
    } finally {
        setLoading(false);
    }
  }

  const handleAddToCart = (itemId: number) => {
    setCart((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const calculateTotalPoints = () => {
    let total = 0;
    // We need to look up items from rewardItems and searchResultsDishes potentially?
    // For simplicity, let's assume all cart items are in rewardItems for now or we just map from known lists.
    // A more robust way would be to have a map of all loaded items.
    // Let's iterate over rewardItems to find price.
    rewardItems.forEach((item) => {
      if (cart[item.id]) {
        total += Math.round(item.price * 10) * cart[item.id];
      }
    });
    return total;
  };

  const handleCheckout = () => {
    const cartItems = rewardItems.filter(item => cart[item.id]).map(item => ({
        ...item,
        quantity: cart[item.id],
        pointsPrice: Math.round(item.price * 10)
    }));

    if (cartItems.length === 0) return;

    router.push({
        pathname: "/checkout",
        params: {
            cartData: JSON.stringify(cartItems),
            restaurantName: "Recompensas Nexe"
        }
    });
  };

  const renderRewardItem: ListRenderItem<MenuItemResult> = ({ item }) => (
      <RewardCard
        item={item}
        quantity={cart[item.id] || 0}
        onAdd={() => handleAddToCart(item.id)}
        onRemove={() => handleRemoveFromCart(item.id)}
      />
  );

  const getGreeting = () => {
      if (!session?.user) return 'Hola, Invitado';
      const meta = session.user.user_metadata;
      const name = meta?.full_name?.split(' ')[0] || meta?.username || 'Viajero';
      return `Hola, ${name}`;
  };

  const getInitials = () => {
      if (!session?.user) return '?';
      const meta = session.user.user_metadata;
      const name = meta?.full_name || meta?.username || 'U';
      return name.charAt(0).toUpperCase();
  };

  const totalPoints = calculateTotalPoints();
  const cartItemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* 1. Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View>
              <Text style={styles.greetingText}>{getGreeting()}</Text>
              <Text style={styles.statusText}>Nivel Explorador</Text>
          </View>
          <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconButton} onPress={() => {}}>
                  <IconSymbol name="bell.fill" size={24} color="#121212" />
                  <View style={styles.notificationDot} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.avatarContainer} onPress={() => router.push('/profile')}>
                  <Text style={styles.avatarText}>{getInitials()}</Text>
              </TouchableOpacity>
          </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
          {/* 2. Hero Card (Wallet) */}
          <View style={styles.heroContainer}>
            <View style={styles.heroCard}>
                <View style={styles.heroLeft}>
                    <Text style={styles.heroPoints}>{points.toLocaleString()}</Text>
                    <Text style={styles.heroLabel}>Puntos Nexe disponibles</Text>
                </View>
                <TouchableOpacity
                    style={styles.heroButton}
                    activeOpacity={0.8}
                    onPress={() => handlePress(() => router.push('/scan'))}
                >
                    <IconSymbol name="qrcode.viewfinder" size={20} color="#fff" style={{marginRight: 6}} />
                    <Text style={styles.heroButtonText}>Escanear</Text>
                </TouchableOpacity>
            </View>
          </View>

          {/* 3. Search & Filters */}
          <View style={styles.searchSection}>
              <View style={styles.searchBar}>
                  <Ionicons name="search-outline" size={20} color="#6E7278" style={{marginRight: 10}} />
                  <TextInput
                    placeholder="Buscar comercio o oferta..."
                    placeholderTextColor="#6E7278"
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={handleSearch}
                  />
                  {isSearching && (
                        <TouchableOpacity onPress={() => handlePress(() => handleSearch(""))}>
                            <Ionicons name="close-circle" size={18} color="#6E7278" />
                        </TouchableOpacity>
                  )}
              </View>

              {!isSearching && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
                      {["Restauración", "Moda", "Servicios", "Ocio"].map((cat) => (
                          <TouchableOpacity
                            key={cat}
                            style={[styles.filterPill, activeCategory === cat && styles.filterPillActive]}
                            onPress={() => setActiveCategory(activeCategory === cat ? null : cat)}
                          >
                              <Text style={[styles.filterText, activeCategory === cat && styles.filterTextActive]}>{cat}</Text>
                          </TouchableOpacity>
                      ))}
                  </ScrollView>
              )}
          </View>

          {/* Search Results */}
          {isSearching ? (
             <View style={styles.sectionContainer}>
                 {searching ? (
                      <ActivityIndicator size="large" color="#000" style={{marginTop: 20}} />
                  ) : (
                      <>
                        <Text style={styles.sectionTitle}>Resultados</Text>
                        {searchResultsRestaurants.map(item => (
                            <BusinessRow key={`rest-${item.id}`} restaurant={item} />
                        ))}
                         {searchResultsDishes.map(item => (
                            <DishResultCard key={`dish-${item.id}`} item={item} />
                        ))}
                        {searchResultsRestaurants.length === 0 && searchResultsDishes.length === 0 && (
                            <Text style={{textAlign: 'center', marginTop: 20, color: '#6E7278'}}>No se encontraron resultados.</Text>
                        )}
                      </>
                  )}
             </View>
          ) : (
            <>
                {/* 4. Offers Near You (Rewards) - CHANGED TO REWARD ITEMS */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recompensas Activas</Text>
                        <TouchableOpacity onPress={() => {}}>
                            <Text style={styles.seeAllText}>Ver todo</Text>
                        </TouchableOpacity>
                    </View>
                    {loading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <FlatList
                            data={rewardItems}
                            renderItem={renderRewardItem}
                            keyExtractor={(item) => item.id.toString()}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.carouselContent}
                        />
                    )}
                </View>

                {/* 5. Local Businesses List */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Comercios Nexe</Text>
                    {loading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <View style={styles.listContainer}>
                            {popularRestaurants.map((restaurant, index) => (
                                <BusinessRow
                                    key={restaurant.id}
                                    restaurant={restaurant}
                                    isLast={index === popularRestaurants.length - 1}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </>
          )}

      </ScrollView>

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <View style={styles.floatingButtonContainer}>
            <TouchableOpacity style={styles.cartButton} onPress={handleCheckout}>
                <View style={styles.cartCountCircle}>
                    <Text style={styles.cartCountText}>{cartItemCount}</Text>
                </View>
                <Text style={styles.cartButtonText}>Ver Pedido</Text>
                <Text style={styles.cartButtonPrice}>{totalPoints} pts</Text>
            </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// Components

function RewardCard({ item, quantity, onAdd, onRemove }: { item: MenuItemResult, quantity: number, onAdd: () => void, onRemove: () => void }) {
    const pointsPrice = Math.round(item.price * 10);
    return (
        <View style={styles.rewardCard}>
            <View style={styles.rewardImageContainer}>
                <Image source={{ uri: item.image_url }} style={styles.rewardImage} contentFit="cover" />
            </View>
            <View style={styles.rewardContent}>
                <Text style={styles.rewardTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.rewardSubtitle} numberOfLines={1}>{item.restaurants?.name}</Text>

                <View style={styles.rewardFooter}>
                    <Text style={styles.rewardPrice}>{pointsPrice} pts</Text>

                    {quantity > 0 ? (
                        <View style={styles.qtyControlSmall}>
                            <TouchableOpacity onPress={onRemove} style={styles.qtyBtnSmall}>
                                <Ionicons name="remove" size={12} color="#000" />
                            </TouchableOpacity>
                            <Text style={styles.qtyTextSmall}>{quantity}</Text>
                            <TouchableOpacity onPress={onAdd} style={styles.qtyBtnSmall}>
                                <Ionicons name="add" size={12} color="#000" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.addButton} onPress={onAdd}>
                            <Ionicons name="add" size={16} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}

function BusinessRow({ restaurant, isLast }: { restaurant: Restaurant, isLast?: boolean }) {
    const router = useRouter();
    return (
        <TouchableOpacity
            style={[styles.businessRow, isLast && { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
            onPress={() => {
                if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/restaurant/${restaurant.id}`);
            }}
        >
            <Image source={{ uri: restaurant.image_url }} style={styles.businessImage} contentFit="cover" />
            <View style={styles.businessInfo}>
                <Text style={styles.businessName} numberOfLines={1}>{restaurant.name}</Text>
                <Text style={styles.businessMeta} numberOfLines={1}>{restaurant.cuisine_type} • 200m</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
    );
}

function DishResultCard({ item }: { item: MenuItemResult }) {
    const router = useRouter();
    return (
        <TouchableOpacity
            style={styles.businessRow}
            onPress={() => router.push(`/restaurant/${item.restaurant_id}`)}
        >
             <Image source={{ uri: item.image_url }} style={styles.businessImage} contentFit="cover" />
             <View style={styles.businessInfo}>
                <Text style={styles.businessName}>{item.name}</Text>
                <Text style={styles.businessMeta}>{item.restaurants?.name}</Text>
            </View>
            <Text style={{fontWeight:'600'}}>${item.price}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Pure White
  },

  // Header
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 20,
      backgroundColor: '#FFFFFF',
  },
  greetingText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#121212',
  },
  statusText: {
      fontSize: 12,
      color: '#6E7278',
      marginTop: 2,
  },
  headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  iconButton: {
      position: 'relative',
      marginRight: 16,
      padding: 4,
  },
  notificationDot: {
      position: 'absolute',
      top: 4,
      right: 6,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'red',
      borderWidth: 1,
      borderColor: '#fff',
  },
  avatarContainer: {
      width: 40,
      height: 40,
      borderRadius: 14, // Squircle-ish
      backgroundColor: '#F5F6F8',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
  },
  avatarText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#121212',
  },

  // Hero Card
  heroContainer: {
      paddingHorizontal: 20,
      marginBottom: 24,
  },
  heroCard: {
      backgroundColor: '#F5F6F8', // Smoke Gray
      borderRadius: 24,
      padding: 24,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  heroLeft: {
      flex: 1,
  },
  heroPoints: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#121212',
      letterSpacing: -1,
  },
  heroLabel: {
      fontSize: 14,
      color: '#6E7278',
      marginTop: 4,
  },
  heroButton: {
      backgroundColor: '#000000',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 18,
  },
  heroButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 14,
  },

  // Search & Filters
  searchSection: {
      marginBottom: 32,
  },
  searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F5F6F8',
      marginHorizontal: 20,
      paddingHorizontal: 16,
      height: 50,
      borderRadius: 16,
      marginBottom: 16,
  },
  searchInput: {
      flex: 1,
      fontSize: 16,
      color: '#121212',
  },
  filterScroll: {
      paddingLeft: 20,
  },
  filterContent: {
      paddingRight: 20,
  },
  filterPill: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: '#F5F6F8',
      marginRight: 10,
  },
  filterPillActive: {
      backgroundColor: '#000000',
  },
  filterText: {
      fontSize: 14,
      color: '#121212',
      fontWeight: '500',
  },
  filterTextActive: {
      color: '#FFFFFF',
  },

  // Sections
  sectionContainer: {
      marginBottom: 32,
  },
  sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 16,
  },
  sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#121212',
  },
  seeAllText: {
      fontSize: 14,
      color: '#007AFF', // Blue Accent
      fontWeight: '600',
  },
  carouselContent: {
      paddingHorizontal: 20,
      paddingRight: 8, // Adjust for last item spacing
  },

  // Reward Card
  rewardCard: {
      width: 160,
      marginRight: 16,
      backgroundColor: '#F5F6F8',
      borderRadius: 20,
      overflow: 'hidden',
      paddingBottom: 12,
  },
  rewardImageContainer: {
      height: 100,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: 'hidden',
  },
  rewardImage: {
      width: '100%',
      height: '100%',
      backgroundColor: '#ddd',
  },
  rewardContent: {
      padding: 12,
  },
  rewardTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#121212',
      marginBottom: 2,
  },
  rewardSubtitle: {
      fontSize: 11,
      color: '#6E7278',
      marginBottom: 8,
  },
  rewardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  rewardPrice: {
      fontSize: 13,
      fontWeight: '700',
      color: '#121212',
  },
  addButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#000',
      justifyContent: 'center',
      alignItems: 'center',
  },
  qtyControlSmall: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 2,
  },
  qtyBtnSmall: {
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
  },
  qtyTextSmall: {
      fontSize: 12,
      fontWeight: 'bold',
      marginHorizontal: 4,
  },

  // Business Row
  listContainer: {
      paddingHorizontal: 20,
  },
  businessRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0', // Thin separator
  },
  businessImage: {
      width: 50,
      height: 50,
      borderRadius: 16, // Squircle 16px
      backgroundColor: '#F5F6F8',
      marginRight: 16,
  },
  businessInfo: {
      flex: 1,
      marginRight: 10,
  },
  businessName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#121212',
      marginBottom: 2,
  },
  businessMeta: {
      fontSize: 13,
      color: '#6E7278',
  },

  // Floating Button
  floatingButtonContainer: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 20,
  },
  cartButton: {
      backgroundColor: '#121212',
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
      borderRadius: 24,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
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
