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
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.6; // Wider card (60% of screen)

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
                <View style={styles.badgeContainer}>
                     <View style={styles.pointsBadge}>
                        <Ionicons name="star" size={10} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.pointsText}>{pointsPrice} pts</Text>
                    </View>
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.textContainer}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.restaurantName} numberOfLines={1}>{item.restaurants?.name}</Text>
                </View>
                
                <View style={styles.actionButton}>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginRight: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        height: CARD_WIDTH * 0.75, // 4:3 Aspect Ratio
        backgroundColor: '#F3F4F6',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    badgeContainer: {
        position: 'absolute',
        top: 12,
        left: 12,
    },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 100,
        backdropFilter: 'blur(4px)',
    },
    pointsText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    content: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    textContainer: {
        flex: 1,
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
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#111827', // Dark button
        alignItems: 'center',
        justifyContent: 'center',
    },
});
