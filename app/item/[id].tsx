import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Share, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
  FadeInDown,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const PARALLAX_HEADER_HEIGHT = 420;

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

  // Flat, simple parallax (scale only, no translate overlap)
  const headerStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-PARALLAX_HEADER_HEIGHT, 0],
      [1.5, 1],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }],
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
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Flat Header (Back & Share) - No Blur/Shadow */}
      <View style={[styles.floatingHeader, { paddingTop: insets.top + 10 }]}>
         <TouchableOpacity
            style={styles.iconButtonFlat}
            onPress={() => router.back()}
            activeOpacity={0.7}
         >
            <Ionicons name="arrow-back" size={24} color="#111827" />
         </TouchableOpacity>

         <TouchableOpacity
            style={styles.iconButtonFlat}
            onPress={handleShare}
            activeOpacity={0.7}
         >
            <Ionicons name="share-outline" size={24} color="#111827" />
         </TouchableOpacity>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* Clean Image Header */}
        <View style={styles.heroImageContainer}>
            <Animated.View style={[styles.imageWrapper, headerStyle]}>
                 <Image source={{ uri: item.image_url }} style={styles.heroImage} contentFit="cover" transition={400} />
            </Animated.View>
        </View>

        {/* Content Body - Flat & Clean */}
        <View style={styles.contentContainer}>

            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.headerSection}>
                <View style={[styles.categoryBadge]}>
                    <Text style={[styles.categoryText]}>NUEVO</Text>
                </View>
                <Text style={styles.title}>{item.name}</Text>

                {/* Price Display - Large & Bold */}
                <View style={styles.priceContainer}>
                    {hasDiscount && (
                        <Text style={styles.originalPrice}>
                            {originalPrice.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                        </Text>
                    )}
                    <Text style={styles.finalPrice}>
                        {finalPrice.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                    </Text>
                </View>
            </Animated.View>

            <View style={styles.spacer} />

            {/* Description */}
            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
                <Text style={styles.sectionTitle}>Detalles</Text>
                <Text style={styles.descriptionText}>{item.description}</Text>
            </Animated.View>

            <View style={styles.spacer} />

            {/* Availability / Locale */}
            {item.locales && (
                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
                    <Text style={styles.sectionTitle}>Disponible en</Text>
                    <TouchableOpacity
                        style={styles.localeCard}
                        onPress={() => router.push(`/restaurant/${item.locales?.id}`)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.localeIcon}>
                            <Ionicons name="storefront-outline" size={24} color="#111827" />
                        </View>
                        <View style={{flex: 1}}>
                            <Text style={styles.localeName}>{item.locales.name}</Text>
                            <Text style={styles.localeAddress}>{item.locales.address}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </Animated.View>
            )}

        </View>
      </Animated.ScrollView>

      {/* Flat Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.redeemButtonWrapper}>
            <TouchableOpacity
                style={styles.redeemButton}
                onPress={handleRedeem}
                activeOpacity={0.85}
            >
                <Text style={styles.redeemButtonText}>Añadir al carrito</Text>
                <View style={styles.pricePill}>
                    <Text style={styles.pricePillText}>
                        {finalPrice.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                    </Text>
                </View>
            </TouchableOpacity>
          </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  iconButtonFlat: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    // No shadow, simple border
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },

  // Hero
  heroImageContainer: {
    height: PARALLAX_HEADER_HEIGHT,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  imageWrapper: {
      width: '100%',
      height: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },

  // Content
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  headerSection: {
    marginBottom: 24,
  },
  categoryBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 100,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#111827', // Black border default
      backgroundColor: 'transparent',
  },
  categoryText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: '#111827',
  },
  title: {
    fontSize: 34,
    fontWeight: '900', // Extra bold
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  priceContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 12,
  },
  originalPrice: {
      color: '#9CA3AF',
      textDecorationLine: 'line-through',
      fontSize: 18,
      fontWeight: '500',
  },
  finalPrice: {
      fontSize: 32,
      fontWeight: '800',
      letterSpacing: -1,
      color: '#111827',
  },

  spacer: {
      height: 1,
      backgroundColor: 'rgba(0,0,0,0.06)',
      marginVertical: 24,
  },

  section: {
      marginBottom: 8,
  },
  sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
  },
  descriptionText: {
      fontSize: 17,
      color: '#4B5563',
      lineHeight: 28,
      fontWeight: '400',
  },

  // Locale Card - Flat
  localeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      padding: 20,
      borderRadius: 20,
      gap: 16,
      // Flat Border
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.08)',
  },
  localeIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(0,0,0,0.04)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  localeName: {
      color: '#111827',
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 4,
  },
  localeAddress: {
      color: '#6B7280',
      fontSize: 14,
  },

  // Bottom Bar - Flat
  bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'transparent',
      paddingHorizontal: 20,
      paddingTop: 0,
  },
  redeemButtonWrapper: {
      height: 64,
      borderRadius: 32,
      overflow: 'hidden',
      backgroundColor: '#111827', // Static black
  },
  redeemButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8, // Inner padding for pill
      paddingLeft: 24,
  },
  redeemButtonText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: -0.3,
  },
  pricePill: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 24,
      minWidth: 80,
      alignItems: 'center',
  },
  pricePillText: {
      fontSize: 16,
      fontWeight: '800',
      color: '#111827',
  },
});
