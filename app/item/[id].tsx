import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Share, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
  FadeInDown,
  withTiming,
  withDelay
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { hexToRgba, getCategoryColor } from '@/lib/colorGenerator';

const { width } = Dimensions.get('window');
const PARALLAX_HEADER_HEIGHT = 350;

interface ItemDetail {
  id: number;
  name: string;
  description: string;
  price_euros: number;
  discount_percentage: number;
  image_url: string;
  restaurant_id: number;
  locales: {
      id: number;
      name: string;
      address: string;
  } | null;
}

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Background Color Animation
  const backgroundColor = useSharedValue('rgba(255,255,255,1)');

  const scrollY = useSharedValue(0);

  useEffect(() => {
    async function fetchItem() {
      if (!id) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('items')
          .select('*, locales(id, name, address)')
          .eq('id', id)
          .single();

        if (error) throw error;
        setItem(data);

        // Use Item Name to generate a consistent subtle tint
        if (data.name) {
             const primary = getCategoryColor(data.name);
             // Very light, subtle opacity (8%) for a premium, non-muddy look
             const subtleColor = hexToRgba(primary, 0.08);
             backgroundColor.value = withTiming(subtleColor, { duration: 1000 });
        }

      } catch (error) {
        console.error("Error fetching item:", error);
        Alert.alert("Error", "No se pudo cargar el item.");
        router.back();
      } finally {
        setLoading(false);
      }
    }

    fetchItem();
  }, [id]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const animatedBackgroundStyle = useAnimatedStyle(() => {
      return {
          backgroundColor: backgroundColor.value,
      };
  });

  const headerStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-PARALLAX_HEADER_HEIGHT, 0],
      [2, 1],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [-PARALLAX_HEADER_HEIGHT, 0, PARALLAX_HEADER_HEIGHT],
      [-PARALLAX_HEADER_HEIGHT / 2, 0, PARALLAX_HEADER_HEIGHT * 0.75],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }, { translateY }],
    };
  });

  const handleShare = async () => {
    if (!item) return;
    try {
        await Share.share({
            message: `Mira este ${item.name} en NEXE!`,
            url: item.image_url, // iOS only
            title: item.name
        });
    } catch (error) {
        console.log(error);
    }
  };

  const hasDiscount = item ? item.discount_percentage > 0 : false;
  const originalPrice = item ? (item.price_euros || 0) : 0;
  const finalPrice = hasDiscount ? originalPrice * (1 - item!.discount_percentage / 100) : originalPrice;
  const pointsNeeded = Math.round(finalPrice * 10);

  const handleRedeem = () => {
      if (!item) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const cartItem = [{
          id: item.id,
          name: item.name,
          quantity: 1,
          pointsPrice: pointsNeeded
      }];

      router.push({
          pathname: "/checkout",
          params: {
              cartData: JSON.stringify(cartItem),
              restaurantName: item.locales?.name || 'NEXE Shop'
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

  if (!item) return null;

  return (
    <Animated.View style={[styles.container, animatedBackgroundStyle]}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Floating Header (Back & Share) */}
      <View style={[styles.floatingHeader, { paddingTop: insets.top + 10 }]}>
         <TouchableOpacity
            style={styles.iconButtonBlur}
            onPress={() => router.back()}
            activeOpacity={0.8}
         >
            <Ionicons name="arrow-back" size={24} color="#121212" />
         </TouchableOpacity>

         <TouchableOpacity
            style={styles.iconButtonBlur}
            onPress={handleShare}
            activeOpacity={0.8}
         >
            <Ionicons name="share-outline" size={22} color="#121212" />
         </TouchableOpacity>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Parallax Image */}
        <Animated.View style={[styles.heroImageContainer, headerStyle]}>
            <Image source={{ uri: item.image_url }} style={styles.heroImage} contentFit="cover" transition={300} />
            <LinearGradient
                colors={['rgba(255,255,255,0.1)', 'transparent', 'transparent', backgroundColor.value]}
                style={styles.heroGradient}
                locations={[0, 0.2, 0.8, 1]}
            />
        </Animated.View>

        {/* Content Body */}
        {/* We use an animated style here too to blend the sheet with the background nicely */}
        <Animated.View style={[styles.contentContainer, animatedBackgroundStyle]}>

            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.headerSection}>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>ITEM</Text>
                </View>
                <Text style={styles.title}>{item.name}</Text>

                {/* Price Row */}
                <View style={styles.priceRow}>
                    <View style={styles.euroPriceContainer}>
                        {hasDiscount && (
                            <Text style={styles.originalPrice}>
                                {originalPrice.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                            </Text>
                        )}
                        <Text style={styles.finalPrice}>
                            {finalPrice.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                        </Text>
                    </View>
                </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.divider} />

            {/* Description */}
            <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
                <Text style={styles.sectionTitle}>Detalles del producto</Text>
                <Text style={styles.descriptionText}>{item.description}</Text>
            </Animated.View>

            {/* Availability / Locale */}
            {item.locales && (
                <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
                    <Text style={styles.sectionTitle}>Disponible en</Text>
                    <TouchableOpacity
                        style={styles.localeCard}
                        onPress={() => router.push(`/restaurant/${item.locales?.id}`)}
                    >
                        <View style={styles.localeIcon}>
                            <Ionicons name="storefront" size={24} color="#121212" />
                        </View>
                        <View style={{flex: 1}}>
                            <Text style={styles.localeName}>{item.locales.name}</Text>
                            <Text style={styles.localeAddress}>{item.locales.address}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </Animated.View>
            )}

        </Animated.View>
      </Animated.ScrollView>

      {/* Sticky Bottom Action */}
      <Animated.View entering={FadeInDown.delay(500)} style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.redeemButton}
            onPress={handleRedeem}
            activeOpacity={0.9}
          >
              <View style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                <Text style={styles.redeemButtonText}>Añadir al carrito</Text>
                <Text style={styles.redeemButtonSubtext}>
                    {finalPrice.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                </Text>
              </View>
              <View style={styles.cartIconContainer}>
                <Ionicons name="cart" size={20} color="#000" />
              </View>
          </TouchableOpacity>
      </Animated.View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Fallback
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  iconButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Hero
  heroImageContainer: {
    height: PARALLAX_HEADER_HEIGHT,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: -1,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Content
  contentContainer: {
    marginTop: PARALLAX_HEADER_HEIGHT - 60,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 32,
    minHeight: 800,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  headerSection: {
    marginBottom: 24,
  },
  categoryBadge: {
      backgroundColor: 'rgba(255,255,255,0.5)', // More translucent on colored bg
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.05)',
  },
  categoryText: {
      color: '#4B5563',
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
  },
  euroPriceContainer: {
      flexDirection: 'column',
      alignItems: 'flex-start',
  },
  originalPrice: {
      color: '#9CA3AF',
      textDecorationLine: 'line-through',
      fontSize: 14,
      fontWeight: '500',
  },
  finalPrice: {
      color: '#111827',
      fontSize: 20,
      fontWeight: '700',
  },

  divider: {
      height: 1,
      backgroundColor: 'rgba(0,0,0,0.05)', // Use alpha for better blending
      marginBottom: 24,
  },

  section: {
      marginBottom: 32,
  },
  sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 12,
  },
  descriptionText: {
      fontSize: 16,
      color: '#4B5563',
      lineHeight: 26,
  },

  // Locale Card
  localeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.6)', // Semi-transparent
      padding: 16,
      borderRadius: 16,
      gap: 16,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.05)',
  },
  localeIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
  },
  localeName: {
      color: '#111827',
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 2,
  },
  localeAddress: {
      color: '#6B7280',
      fontSize: 13,
  },

  // Bottom Bar
  bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      // We don't apply background color here to keep it "floating" visually or just white
      backgroundColor: 'rgba(255,255,255,0.95)',
      paddingHorizontal: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0,0,0,0.05)',
  },
  redeemButton: {
      backgroundColor: '#111827',
      height: 64,
      borderRadius: 32,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
  },
  redeemButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 2,
  },
  redeemButtonSubtext: {
      color: '#9CA3AF',
      fontSize: 13,
      fontWeight: '500',
  },
  cartIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
  },
});
