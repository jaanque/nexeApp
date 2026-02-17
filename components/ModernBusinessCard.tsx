import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface Restaurant {
    id: number;
    name: string;
    image_url: string;
    rating: number;
    cuisine_type: string;
    address: string;
}

interface ModernBusinessCardProps {
    restaurant: Restaurant;
    distance?: string;
    isLast?: boolean;
}

export function ModernBusinessCard({ restaurant, distance, isLast }: ModernBusinessCardProps) {
    const router = useRouter();

    const handlePress = () => {
        if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (restaurant?.id) {
             router.push(`/restaurant/${restaurant.id}`);
        }
    };

    if (!restaurant) return null;

    return (
        <TouchableOpacity
            style={[styles.container, isLast && { marginBottom: 100 }]}
            activeOpacity={0.95}
            onPress={handlePress}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: restaurant.image_url }}
                    style={styles.image}
                    contentFit="cover"
                    transition={300}
                />

                {/* Rating Badge */}
                <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.ratingText}>{(restaurant.rating || 0).toFixed(1)}</Text>
                </View>

                {/* Distance Badge (Overlay) */}
                {distance && (
                    <View style={styles.distanceBadgeOverlay}>
                        <Text style={styles.distanceTextOverlay}>{distance}</Text>
                    </View>
                )}
            </View>

            <View style={styles.infoContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
                </View>

                <Text style={styles.cuisine}>{restaurant.cuisine_type}</Text>

                <View style={styles.addressRow}>
                     <Ionicons name="location-outline" size={14} color="#9CA3AF" style={{marginRight: 4}} />
                     <Text style={styles.address} numberOfLines={1}>{restaurant.address}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 16, // More subtle "Squircle"
        marginBottom: 20, // Reduced slightly
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4, // Softer shadow offset
        },
        shadowOpacity: 0.06, // Much lighter shadow
        shadowRadius: 12, // Diffuse shadow
        elevation: 4,
        overflow: Platform.OS === 'android' ? 'hidden' : 'visible', // Handle shadows correctly
    },
    imageContainer: {
        height: 200, // Slightly reduced height for better density
        width: '100%',
        backgroundColor: '#f0f0f0',
        position: 'relative',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    ratingBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 4,
        color: '#121212',
    },
    distanceBadgeOverlay: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    distanceTextOverlay: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    infoContainer: {
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 18,
        fontWeight: '700', // Bold but not heavy
        color: '#111827', // Gray 900
        letterSpacing: -0.3,
    },
    cuisine: {
        fontSize: 13,
        color: '#6B7280', // Gray 500
        fontWeight: '500',
        marginBottom: 10,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    address: {
        fontSize: 13,
        color: '#9CA3AF', // Gray 400
        flex: 1,
    },
});
