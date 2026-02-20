import { getOptimizedImageSource } from '@/lib/imageOptimization';
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
    price_euros?: number;
    discount_percentage?: number;
    image_url: string;
    restaurant_id: number;
    locales?: {
        name: string;
        opening_time?: string;
        closing_time?: string;
    } | null;
    category_id?: number;
}

interface ModernRewardCardProps {
    item: MenuItemResult;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7; // Wider

export const ModernRewardCard = React.memo(({ item }: ModernRewardCardProps) => {
    const router = useRouter();

    // Price Calculations
    const originalPrice = item.price_euros || 0;
    const hasDiscount = item.discount_percentage && item.discount_percentage > 0;

    let finalPrice = originalPrice;
    if (hasDiscount) {
        finalPrice = originalPrice * (1 - item.discount_percentage! / 100);
    }

    const formattedOriginal = originalPrice.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
    const formattedFinal = finalPrice.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

    // Check if venue is closed
    const isClosed = React.useMemo(() => {
        if (!item.locales?.opening_time || !item.locales?.closing_time) return false;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const [openH, openM] = item.locales.opening_time.split(':').map(Number);
        const [closeH, closeM] = item.locales.closing_time.split(':').map(Number);

        const openTime = openH * 60 + openM;
        const closeTime = closeH * 60 + closeM;

        if (closeTime < openTime) {
            // Crosses midnight
            return !(currentTime >= openTime || currentTime <= closeTime);
        }
        return !(currentTime >= openTime && currentTime <= closeTime);
    }, [item.locales]);

    const handlePress = () => {
        if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/item/${item.id}`);
    };

    return (
        <TouchableOpacity
            style={[styles.card, isClosed && { opacity: 0.6 }]}
            activeOpacity={0.9}
            onPress={handlePress}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={getOptimizedImageSource(item.image_url, 300)}
                    style={styles.image}
                    contentFit="cover"
                    transition={200}
                />
                {isClosed && (
                    <View style={styles.closedOverlay}>
                        <Text style={styles.closedText}>Cerrado</Text>
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <View style={styles.textContainer}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.restaurantRow}>
                        <Text style={styles.restaurantName} numberOfLines={1}>{item.locales?.name}</Text>
                    </View>

                    <View style={styles.priceContainer}>
                        {hasDiscount ? (
                            <View style={styles.discountRow}>
                                <Text style={styles.originalPriceText}>{formattedOriginal}</Text>
                                <View style={styles.discountBadge}>
                                    <Text style={styles.discountText}>-{item.discount_percentage}%</Text>
                                </View>
                                <Text style={styles.finalPriceText}>{formattedFinal}</Text>
                            </View>
                        ) : (
                            // Fallback if no discount/points logic applies (just show price)
                            <Text style={styles.finalPriceText}>{formattedOriginal}</Text>
                        )}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
});

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
    restaurantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    restaurantName: {
        color: '#6B7280',
        fontSize: 13,
        fontWeight: '500',
        maxWidth: '75%',
    },
    closedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    closedText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        textTransform: 'uppercase',
    },
    priceContainer: {
        marginTop: 8,
    },
    discountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start', // Pack items together
        gap: 8, // Space between items
    },
    originalPriceText: {
        color: '#9CA3AF', // Gray 400
        fontSize: 12,
        textDecorationLine: 'line-through',
        fontWeight: '500',
    },
    finalPriceText: {
        color: '#111827',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    discountBadge: {
        backgroundColor: '#EF4444', // Red
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    discountText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
});
