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
const CARD_WIDTH = width * 0.42; // Slightly narrower to show more content

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
            <Image
                source={{ uri: item.image_url }}
                style={styles.image}
                contentFit="cover"
                transition={200}
            />

            {/* Gradient Overlay */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
                locations={[0, 0.5, 1]}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <View style={styles.topRow}>
                        <View style={styles.pointsBadge}>
                             <Text style={styles.pointsText}>{pointsPrice} pts</Text>
                        </View>
                    </View>

                    <View style={styles.bottomInfo}>
                        <Text style={styles.restaurantName} numberOfLines={1}>{item.restaurants?.name}</Text>
                        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        height: CARD_WIDTH * 1.5, // Taller aspect ratio (2:3)
        borderRadius: 20, // Rounded corners
        marginRight: 16,
        backgroundColor: '#E5E7EB', // Gray 200 placeholder
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
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
        height: '100%', // Full height gradient for better text pop
        justifyContent: 'flex-end',
        padding: 12,
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
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    pointsText: {
        color: '#111827',
        fontSize: 12,
        fontWeight: '700',
    },
    bottomInfo: {
        gap: 2,
    },
    restaurantName: {
        color: '#D1D5DB', // Gray 300
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    itemName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        lineHeight: 20,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});
