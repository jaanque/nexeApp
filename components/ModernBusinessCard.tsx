import { getOptimizedImageSource } from '@/lib/imageOptimization';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

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

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const ModernBusinessCard = React.memo(({ restaurant, distance, isLast, isGrid }: ModernBusinessCardProps) => {
    const router = useRouter();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

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
        const openingTime = `${h}:${m}`;

        // Simple heuristic: If closed, and current time > opening time, it probably opens tomorrow.
        const now = new Date();
        const currentH = now.getHours();
        const currentM = now.getMinutes();

        const [openH, openM] = restaurant.opening_time.split(':').map(Number);

        if (currentH > openH || (currentH === openH && currentM >= openM)) {
            return `Mañana ${openingTime}`;
        }

        return openingTime;
    }, [restaurant.opening_time]);

    return (
        <AnimatedTouchableOpacity
            style={[styles.container, isGrid && styles.gridContainer, isLast && { marginBottom: 100 }, animatedStyle]}
            activeOpacity={1}
            onPress={handlePress}
            onPressIn={() => scale.value = withSpring(0.95)}
            onPressOut={() => scale.value = withSpring(1)}
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
                    <Text style={styles.cuisine} numberOfLines={1}>{restaurant.cuisine_type}</Text>

                    <View style={styles.distanceWrapper}>
                         <Ionicons name="location-outline" size={12} color="#6B7280" />
                        <Text style={styles.distance} numberOfLines={1}>
                            {distance || '...'}
                        </Text>
                    </View>
                </View>
            </View>
        </AnimatedTouchableOpacity>
    );
});

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
        borderRadius: 16,
        backgroundColor: '#FFFFFF', // White background
        // Reduced shadow for cleaner look
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    imageWrapper: {
        height: 180, // Standard height
        width: '100%',
        backgroundColor: '#F3F4F6',
        position: 'relative',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden', // Clip image
    },
    image: {
        width: '100%',
        height: '100%',
    },
    content: {
        padding: 12,
    },
    // Removed ratingBadge styles
    name: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        letterSpacing: -0.5,
        marginBottom: 8, // Increased spacing
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // Category left, Distance right
        width: '100%',
    },
    distanceWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    cuisine: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
        maxWidth: '60%', // Prevent overlap
    },
    distance: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    closedBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: '#EF4444',
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
        height: 140,
    },
    gridName: {
        fontSize: 15,
        marginBottom: 4, // Slightly less for grid
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
