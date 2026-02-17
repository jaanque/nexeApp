import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export interface Promotion {
  id: number;
  title: string;
  description: string;
  discount_percent: number;
  restaurant_id: number;
  restaurants?: {
      name: string;
      image_url?: string;
  };
}

interface PromotionCardProps {
  item: Promotion;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75; // Wider card to show more info

export function PromotionCard({ item }: PromotionCardProps) {
  const router = useRouter();

  const handlePress = () => {
      if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/restaurant/${item.restaurant_id}`);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={styles.container}
    >
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']} // Indigo to Violet gradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
            <View style={styles.topRow}>
                <View style={styles.iconContainer}>
                    <Ionicons name="pricetag" size={20} color="#4F46E5" />
                </View>
                {item.discount_percent > 0 && (
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{item.discount_percent}% OFF</Text>
                    </View>
                )}
            </View>

            <View style={styles.textContainer}>
                <Text style={styles.restaurantName}>{item.restaurants?.name}</Text>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
            </View>

             <View style={styles.bottomRow}>
                <Text style={styles.ctaText}>Ver oferta</Text>
                <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.9)" />
            </View>
        </View>

        {/* Decorative Circle */}
        <View style={styles.decorativeCircle} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: 160,
    marginRight: 16,
    borderRadius: 24,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  gradient: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  discountText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  textContainer: {
      marginTop: 12,
  },
  restaurantName: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
    lineHeight: 22,
  },
  description: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 18,
  },
  bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 'auto',
  },
  ctaText: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: 13,
      fontWeight: '600',
  },
  decorativeCircle: {
      position: 'absolute',
      right: -40,
      bottom: -40,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: 'rgba(255,255,255,0.1)',
      zIndex: 1,
  },
});
