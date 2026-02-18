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
    price: number;
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
    // Display Euro price if available, fallback to points (though instruction implies euros always)
    const displayPrice = item.price_euros
        ? `${item.price_euros.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`
        : `${Math.round(item.price * 10)} pts`;

    // Calculate discounted price if applicable
    const hasDiscount = item.discount_percentage && item.discount_percentage > 0;
    const finalPrice = (hasDiscount && item.price_euros)
        ? (item.price_euros * (1 - item.discount_percentage! / 100))
        : null;

    const finalDisplayPrice = finalPrice
        ? `${finalPrice.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`
        : displayPrice;

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
                        {/* Only show star if points, otherwise just text */}
                        {!item.price_euros && <Ionicons name="star" size={12} color="#F59E0B" />}

                        {hasDiscount && item.price_euros ? (
                            <>
                                <Text style={styles.originalPriceText}>
                                    {item.price_euros.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                                </Text>
                                <Text style={[styles.pointsText, { color: '#EF4444' }]}>{finalDisplayPrice}</Text>
                            </>
                        ) : (
                            <Text style={styles.pointsText}>{displayPrice}</Text>
                        )}
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
        gap: 4,
        marginTop: 4,
    },
    pointsText: {
        color: '#111827',
        fontSize: 14,
        fontWeight: '800', // Bold points
    },
    originalPriceText: {
        color: '#9CA3AF',
        fontSize: 12,
        textDecorationLine: 'line-through',
        fontWeight: '500',
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
