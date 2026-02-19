import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Share, Alert } from 'react-native';
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
  FadeInDown
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

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
    <View style={styles.container}>
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
                colors={['rgba(255,255,255,0.1)', 'transparent', 'transparent', '#FFFFFF']}
                style={styles.heroGradient}
                locations={[0, 0.2, 0.8, 1]}
            />
        </Animated.View>

        {/* Content Body */}
        <View style={styles.contentContainer}>

            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.headerSection}>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>ITEM</Text>
                </View>
                <Text style={styles.title}>{item.name}</Text>

                {/* Price Row */}
                <View style={styles.priceRow}>
                    <View style={styles.pointsBadge}>
                        <Ionicons name="flash" size={16} color="#B45309" />
                        <Text style={styles.pointsText}>{pointsNeeded} pts</Text>
                    </View>

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
                <Text style={styles.sectionTitle}>Descripción</Text>
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

        </View>
      </Animated.ScrollView>

      {/* Sticky Bottom Action */}
      <Animated.View entering={FadeInDown.delay(500)} style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.redeemButton}
            onPress={handleRedeem}
            activeOpacity={0.9}
          >
              <Text style={styles.redeemButtonText}>Canjear por {pointsNeeded} pts</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
      </Animated.View>

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
      backgroundColor: '#F3F4F6',
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      marginBottom: 12,
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
  pointsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      gap: 6,
  },
  pointsText: {
      color: '#B45309',
      fontSize: 18,
      fontWeight: '800',
  },
  euroPriceContainer: {
      flexDirection: 'column',
      alignItems: 'flex-end',
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
      backgroundColor: '#F3F4F6',
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
      backgroundColor: '#F9FAFB',
      padding: 16,
      borderRadius: 16,
      gap: 16,
      borderWidth: 1,
      borderColor: '#E5E7EB',
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
      backgroundColor: 'rgba(255,255,255,0.95)',
      paddingHorizontal: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
  },
  redeemButton: {
      backgroundColor: '#111827',
      height: 56,
      borderRadius: 28,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
  },
  redeemButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
  },
});
