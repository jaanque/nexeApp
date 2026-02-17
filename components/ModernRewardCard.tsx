import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface MenuItemResult {
    id: number;
    name: string;
    description: string;
    price: number;
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
const CARD_WIDTH = width * 0.45; // Increased width (45% of screen)

export function ModernRewardCard({ item }: ModernRewardCardProps) {
    const router = useRouter();
    const pointsPrice = Math.round(item.price * 10);

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
            </View>

            {/* Gradient Overlay */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
                locations={[0, 0.4, 1]}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <View style={styles.topRow}>
                        <View style={styles.pointsBadge}>
                             <Text style={styles.pointsText}>{pointsPrice} pts</Text>
                        </View>
                    </View>

                    <View style={styles.bottomInfo}>
                        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                        <Text style={styles.restaurantName} numberOfLines={1}>{item.restaurants?.name}</Text>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        height: CARD_WIDTH * 1.5, // 2:3 Poster Ratio
        borderRadius: 20,
        marginRight: 16,
        backgroundColor: '#E5E7EB',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: '#D1D5DB', // Placeholder color
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
        padding: 16,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    topRow: {
        alignItems: 'flex-start',
        marginTop: 12,
    },
    pointsBadge: {
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    pointsText: {
        color: '#163D36', // Brand Color
        fontSize: 12,
        fontWeight: '800',
    },
    bottomInfo: {
        gap: 4,
    },
    restaurantName: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    itemName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        lineHeight: 22,
        letterSpacing: -0.3,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
});
