import { getOptimizedImageSource } from '@/lib/imageOptimization';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Restaurant {
    id: number;
    name: string;
    image_url: string;
    rating: number;
    cuisine_type: string;
    address: string;
    opening_time?: string;
    closing_time?: string;
}

interface ModernBusinessCardProps {
    restaurant: Restaurant;
    distance?: string;
    isLast?: boolean;
    isGrid?: boolean;
}

export const ModernBusinessCard = React.memo(({ restaurant, distance, isLast, isGrid }: ModernBusinessCardProps) => {
    const router = useRouter();

    const handlePress = () => {
        if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (restaurant?.id) {
             router.push(`/restaurant/${restaurant.id}`);
        }
    };

    if (!restaurant) return null;

    const isOpen = React.useMemo(() => {
        if (!restaurant.opening_time || !restaurant.closing_time) return true;
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTime = currentHours * 60 + currentMinutes;

        const [openHour, openMinute] = restaurant.opening_time.split(':').map(Number);
        const [closeHour, closeMinute] = restaurant.closing_time.split(':').map(Number);
        const openTime = openHour * 60 + openMinute;
        const closeTime = closeHour * 60 + closeMinute;

        if (closeTime < openTime) {
            // Closes next day (e.g. 10 AM to 2 AM)
            return currentTime >= openTime || currentTime < closeTime;
        }
        return currentTime >= openTime && currentTime < closeTime;
    }, [restaurant.opening_time, restaurant.closing_time]);

    const openingTimeDisplay = React.useMemo(() => {
        if (!restaurant.opening_time) return null;
        const [h, m] = restaurant.opening_time.split(':');
        return `${h}:${m}`;
    }, [restaurant.opening_time]);

    return (
        <TouchableOpacity
            style={[styles.container, isGrid && styles.gridContainer, isLast && { marginBottom: 100 }]}
            activeOpacity={0.95}
            onPress={handlePress}
        >
            <View style={[styles.imageWrapper, isGrid && styles.gridImageWrapper]}>
                <Image
                    source={getOptimizedImageSource(restaurant.image_url, 400)}
                    style={styles.image}
                    contentFit="cover"
                    transition={300}
                    allowDownscaling={true}
                    cachePolicy="memory-disk"
                />

                {/* Rating Badge - Top Right */}
                <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={10} color="#F59E0B" />
                    <Text style={styles.ratingText}>{(restaurant.rating || 0).toFixed(1)}</Text>
                </View>

                {/* Open/Closed Badge - Top Left */}
                {!isOpen && (
                    <View style={[styles.closedBadge, isGrid && styles.gridClosedBadge]}>
                        <Text style={[styles.closedText, isGrid && styles.gridClosedText]}>Cerrado</Text>
                        {!isGrid && openingTimeDisplay && (
                            <Text style={styles.openingTimeSubText}>Abre {openingTimeDisplay}</Text>
                        )}
                    </View>
                )}
            </View>

            {/* Content Section (Below Image) */}
            <View style={styles.content}>
                <Text style={[styles.name, isGrid && styles.gridName]} numberOfLines={1}>{restaurant.name}</Text>
                <View style={styles.metaRow}>
                    {!isGrid && <Text style={styles.cuisine}>{restaurant.cuisine_type}</Text>}
                    {!isGrid && <View style={styles.dot} />}
                    <Ionicons name="location-outline" size={12} color="#6B7280" />
                    <Text style={styles.distance} numberOfLines={1}>
                        {distance || '...'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
        borderRadius: 16,
        backgroundColor: '#FFFFFF', // White background
        borderWidth: 1,
        borderColor: '#E5E7EB', // Light border
        overflow: 'hidden',
        // No shadows
    },
    imageWrapper: {
        height: 180, // Standard height
        width: '100%',
        backgroundColor: '#F3F4F6',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    content: {
        padding: 12,
    },
    ratingBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#111827',
    },
    name: {
        fontSize: 18,
        fontWeight: '700', // Bold but not heavy
        color: '#111827', // Dark text
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cuisine: {
        fontSize: 14,
        color: '#6B7280', // Gray 500
        fontWeight: '500',
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#D1D5DB', // Gray 300
    },
    distance: {
        fontSize: 13,
        color: '#6B7280', // Gray 500
        fontWeight: '500',
    },
    closedBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: '#EF4444', // Red 500
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        zIndex: 10,
    },
    closedText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    openingTimeSubText: {
        color: '#FFFFFF',
        fontWeight: '500',
        fontSize: 10,
        marginTop: 1,
    },
    // Grid Modifications
    gridContainer: {
        marginBottom: 0,
        borderRadius: 16,
    },
    gridImageWrapper: {
        height: 140, // Shorter for grid
    },
    gridName: {
        fontSize: 15,
        marginBottom: 2,
    },
    gridClosedBadge: {
        top: 8,
        left: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    gridClosedText: {
        fontSize: 10,
    },
});
