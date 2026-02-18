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
    isTrending?: boolean;
}

const { width } = Dimensions.get('window');

export function ModernRewardCard({ item, isTrending = false }: ModernRewardCardProps) {
    const router = useRouter();
    const pointsPrice = Math.round(item.price * 10);
    const CARD_WIDTH = isTrending ? width * 0.8 : width * 0.6; // Wider for trending

    const handlePress = () => {
        if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/restaurant/${item.restaurant_id}`);
    };

    return (
        <TouchableOpacity
            style={[styles.card, { width: CARD_WIDTH }]}
            activeOpacity={0.9}
            onPress={handlePress}
        >
            <View style={[styles.imageContainer, isTrending && { height: CARD_WIDTH * 0.55 }]}>
                <Image
                    source={{ uri: item.image_url }}
                    style={styles.image}
                    contentFit="cover"
                    transition={200}
                />
            </View>

            <View style={styles.content}>
                <View style={styles.textContainer}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.restaurantName} numberOfLines={1}>{item.restaurants?.name}</Text>

                    <View style={styles.priceContainer}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={styles.pointsText}>{pointsPrice} pts</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginRight: 16,
        overflow: 'hidden',
        // Removed shadows/elevation for cleaner look
    },
    imageContainer: {
        width: '100%',
        height: 180,
        backgroundColor: '#F3F4F6',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    content: {
        padding: 12,
        paddingTop: 12,
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
    restaurantName: {
        color: '#6B7280',
        fontSize: 13,
        fontWeight: '500',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    pointsText: {
        color: '#111827',
        fontSize: 14,
        fontWeight: '800', // Bold points
    },
});
