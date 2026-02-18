import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MenuItemResult {
    id: number;
    name: string;
    description: string;
    points_needed: number;
    price_euros?: number;
    discount_percentage?: number;
    image_url: string;
    restaurant_id: number;
    restaurants?: {
        name: string;
    };
    category_id?: number;
}

interface ModernRewardCardProps {
    item: MenuItemResult;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7; // Wider

export function ModernRewardCard({ item }: ModernRewardCardProps) {
    const router = useRouter();

    // Calculate prices
    const hasDiscount = item.discount_percentage && item.discount_percentage > 0;

    // Final Euro Price Calculation
    let finalEuroPrice = item.price_euros;
    if (hasDiscount && item.price_euros) {
        finalEuroPrice = item.price_euros * (1 - item.discount_percentage! / 100);
    }

    const formattedEuroPrice = finalEuroPrice
        ? `${finalEuroPrice.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`
        : '0,00 €';

    // Points calculation (from renamed column points_needed)
    const pointsNeeded = item.points_needed ? Math.round(item.points_needed) : 0;

    const handlePress = () => {
        if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/restaurant/${item.restaurant_id}`);
    };

    return (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={handlePress}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: item.image_url }}
                    style={styles.image}
                    contentFit="cover"
                    transition={200}
                />
                {hasDiscount && (
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>-{item.discount_percentage}%</Text>
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <View style={styles.textContainer}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.restaurantName} numberOfLines={1}>{item.restaurants?.name}</Text>

                    <View style={styles.priceContainer}>
                        {/* Display Price in Euros */}
                        <Text style={styles.euroText}>{formattedEuroPrice}</Text>

                        {/* Display Points Needed */}
                        <View style={styles.pointsPill}>
                            <Ionicons name="star" size={10} color="#F59E0B" />
                            <Text style={styles.pointsText}>+{pointsNeeded} pts</Text>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        backgroundColor: 'transparent',
        marginRight: 16,
        // Removed overflow hidden from container to allow potential future effects, but image has radius
    },
    imageContainer: {
        width: '100%',
        height: CARD_WIDTH * 0.6, // Less tall (0.6 aspect ratio instead of 0.75)
        backgroundColor: '#F3F4F6',
        borderRadius: 20, // Radius on image only
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    content: {
        paddingVertical: 8,
        paddingHorizontal: 4, // Slight padding alignment
    },
    textContainer: {
        gap: 4,
    },
    itemName: {
        color: '#111827',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    restaurantName: {
        color: '#6B7280',
        fontSize: 13,
        fontWeight: '500',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    euroText: {
        color: '#111827',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    pointsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB', // Amber 50
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    pointsText: {
        color: '#B45309', // Amber 700
        fontSize: 12,
        fontWeight: '700',
    },
    discountBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#EF4444', // Red
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        zIndex: 10,
    },
    discountText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
});
