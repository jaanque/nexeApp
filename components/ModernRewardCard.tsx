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
const CARD_WIDTH = width * 0.45; // Smaller cards as requested

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
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <Text style={styles.restaurantName} numberOfLines={1}>{item.restaurants?.name}</Text>
                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                    <View style={styles.priceTag}>
                        <Text style={styles.priceText}>{pointsPrice} pts</Text>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        height: CARD_WIDTH * 1.4, // 5:7 aspect ratio roughly
        borderRadius: 24,
        marginRight: 16,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        position: 'relative',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        justifyContent: 'flex-end',
        padding: 16,
    },
    content: {
        gap: 4,
    },
    restaurantName: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    itemName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        lineHeight: 18,
    },
    priceTag: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    priceText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
});
