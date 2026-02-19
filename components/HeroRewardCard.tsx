import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

interface MenuItemResult {
    id: number;
    name: string;
    description: string;
    price: number;
    image_url: string;
    restaurant_id: number;
    locales?: {
        name: string;
    };
    category_id?: number;
}

interface HeroRewardCardProps {
    item: MenuItemResult;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40; // Full width minus margins

export function HeroRewardCard({ item }: HeroRewardCardProps) {
    const router = useRouter();
    const pointsPrice = Math.round(item.price * 10);

    const handlePress = () => {
        if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push(`/restaurant/${item.restaurant_id}`);
    };

    return (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.95}
            onPress={handlePress}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: item.image_url }}
                    style={styles.image}
                    contentFit="cover"
                    transition={300}
                />
            </View>

            {/* Gradient Overlay - darker and taller for better text readability */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)', '#000000']}
                locations={[0, 0.5, 0.8, 1]}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <View style={styles.topRow}>
                        <View style={styles.featuredBadge}>
                            <Ionicons name="sparkles" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                            <Text style={styles.featuredText}>RECOMPENSA DEL DÍA</Text>
                        </View>
                    </View>

                    <View style={styles.bottomInfo}>
                        <View style={styles.restaurantRow}>
                            <Text style={styles.restaurantName} numberOfLines={1}>
                                {item.locales?.name?.toUpperCase()}
                            </Text>
                        </View>

                        <Text style={styles.itemName} numberOfLines={2}>
                            {item.name}
                        </Text>

                        <View style={styles.priceRow}>
                             <View style={styles.pointsBadge}>
                                <Ionicons name="star" size={14} color="#F59E0B" style={{ marginRight: 4 }} />
                                <Text style={styles.pointsText}>{pointsPrice} pts</Text>
                            </View>
                            <Text style={styles.originalPrice}>Original: ${item.price}</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        height: 320, // Tall, imposing height
        borderRadius: 24,
        marginHorizontal: 20,
        marginBottom: 32, // Space below for the next section
        backgroundColor: '#1F2937',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        height: '100%',
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
        height: '60%', // Covers bottom 60%
        justifyContent: 'flex-end',
        padding: 24,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    topRow: {
        alignItems: 'flex-start',
    },
    featuredBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        backdropFilter: 'blur(10px)', // Works on some platforms, ignored on others
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    featuredText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    bottomInfo: {
        gap: 8,
    },
    restaurantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    restaurantName: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 1.5,
    },
    itemName: {
        color: '#FFFFFF',
        fontSize: 28, // Huge title
        fontWeight: '900', // Extra bold
        lineHeight: 32,
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 100,
    },
    pointsText: {
        color: '#121212',
        fontSize: 15,
        fontWeight: '800',
    },
    originalPrice: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
        fontWeight: '500',
        textDecorationLine: 'line-through',
    },
});
