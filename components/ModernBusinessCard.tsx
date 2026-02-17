import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
            style={[styles.container, isLast && { marginBottom: 100 }]} // Extra padding for last item
            activeOpacity={0.9}
            onPress={handlePress}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: restaurant.image_url }}
                    style={styles.image}
                    contentFit="cover"
                    transition={300}
                />
                <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#000" />
                    <Text style={styles.ratingText}>{(restaurant.rating || 0).toFixed(1)}</Text>
                </View>
            </View>

            <View style={styles.infoContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
                    {distance && (
                        <View style={styles.distanceBadge}>
                            <Ionicons name="location-sharp" size={10} color="#6E7278" />
                            <Text style={styles.distanceText}>{distance}</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.cuisine}>{restaurant.cuisine_type}</Text>

                <View style={styles.addressRow}>
                     <Ionicons name="map-outline" size={14} color="#9CA3AF" style={{marginRight: 4}} />
                     <Text style={styles.address} numberOfLines={1}>{restaurant.address}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 24,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 6,
        overflow: 'hidden', // Ensure shadows respect border radius on Android but for iOS we might need to separate
    },
    imageContainer: {
        height: 220, // Taller image
        width: '100%',
        backgroundColor: '#f0f0f0',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    ratingBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
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
        fontWeight: 'bold',
        marginLeft: 4,
    },
    infoContainer: {
        padding: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#121212',
        flex: 1,
        marginRight: 8,
    },
    cuisine: {
        fontSize: 14,
        color: '#6E7278', // Secondary text
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    address: {
        fontSize: 14,
        color: '#9CA3AF',
        flex: 1,
    },
    distanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F6F8',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    distanceText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6E7278',
        marginLeft: 2,
    },
});
