import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
            <View style={styles.imageWrapper}>
                <Image
                    source={{ uri: restaurant.image_url }}
                    style={styles.image}
                    contentFit="cover"
                    transition={300}
                />

                {/* Gradient Overlay for Text Readability */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
                    locations={[0.4, 0.7, 1]}
                    style={styles.gradient}
                >
                     <View style={styles.textContent}>
                        <View style={styles.topMeta}>
                             {/* Rating Badge */}
                            <View style={styles.ratingBadge}>
                                <Ionicons name="star" size={10} color="#F59E0B" />
                                <Text style={styles.ratingText}>{(restaurant.rating || 0).toFixed(1)}</Text>
                            </View>
                        </View>

                        <View>
                            <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
                            <View style={styles.metaRow}>
                                <Text style={styles.cuisine}>{restaurant.cuisine_type}</Text>
                                <View style={styles.dot} />
                                <Ionicons name="location-outline" size={12} color="#D1D5DB" />
                                <Text style={styles.distance}>
                                    {distance || 'A calcular...'}
                                </Text>
                            </View>
                        </View>
                     </View>
                </LinearGradient>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
        borderRadius: 24,
        backgroundColor: '#1F2937', // Darker background
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
        overflow: 'hidden',
    },
    imageWrapper: {
        height: 240, // Taller Hero Image
        width: '100%',
        backgroundColor: '#374151',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '100%',
        justifyContent: 'flex-end',
        padding: 20,
    },
    textContent: {
        flex: 1,
        justifyContent: 'space-between',
    },
    topMeta: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 16,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#121212',
    },
    name: {
        fontSize: 24,
        fontWeight: '800', // Heavy bold
        color: '#FFFFFF',
        letterSpacing: -0.5,
        marginBottom: 6,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cuisine: {
        fontSize: 14,
        color: '#E5E7EB', // Gray 200
        fontWeight: '600',
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#9CA3AF', // Gray 400
    },
    distance: {
        fontSize: 13,
        color: '#D1D5DB', // Gray 300
        fontWeight: '500',
    },
});
