import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
    withTiming,
    runOnJS
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface MenuItemResult {
    id: number;
    name: string;
    description: string;
    price: number; // in points
    image_url: string;
    restaurant_id: number;
    restaurants?: {
        name: string;
    };
    category_id?: number;
}

interface CardDeckItemProps {
    item: MenuItemResult;
    userPoints: number;
}

export default function CardDeckItem({ item, userPoints }: CardDeckItemProps) {
    const [showQR, setShowQR] = useState(false);
    const qrHeight = useSharedValue(0);
    const qrOpacity = useSharedValue(0);

    const handleRedeem = () => {
        if (showQR) {
            // Collapse
            qrHeight.value = withTiming(0);
            qrOpacity.value = withTiming(0, {}, () => runOnJS(setShowQR)(false));
        } else {
            // Expand
            setShowQR(true);
            qrHeight.value = withSpring(250, { damping: 15 });
            qrOpacity.value = withTiming(1, { duration: 300 });
        }
    };

    const qrStyle = useAnimatedStyle(() => ({
        height: qrHeight.value,
        opacity: qrOpacity.value,
        overflow: 'hidden',
    }));

    return (
        <View style={styles.container}>
            {/* Main Image Layer */}
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: item.image_url }}
                    style={styles.image}
                    contentFit="cover"
                    transition={500}
                />

                {/* Gradient Overlay for Text Readability if needed, though design says "Sin sombras duras" */}
                {/* We'll keep it subtle or remove if "Studio Lighting" is preferred.
                    Adding a subtle bottom gradient to blend with the sheet if needed,
                    but the sheet is opaque white. */}
            </View>

            {/* Floating Price Tag */}
            <View style={styles.priceTag}>
                <Text style={styles.priceText}>{item.price} Pts</Text>
            </View>

            {/* Dynamic Island Bottom Sheet */}
            <View style={styles.bottomSheet}>

                {/* Content */}
                <View style={styles.contentContainer}>
                    <Text style={styles.restaurantName}>{item.restaurants?.name || 'Restaurante'}</Text>
                    <Text style={styles.title} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.subtitle} numberOfLines={3}>
                        {item.description || "Crujiente. Mítica. Tuya."}
                    </Text>
                </View>

                {/* Redeem Action */}
                <View style={styles.actionContainer}>
                    <TouchableOpacity
                        style={styles.redeemButton}
                        activeOpacity={0.9}
                        onPress={handleRedeem}
                    >
                        <Text style={styles.redeemButtonText}>
                            {showQR ? 'CERRAR CÓDIGO' : `CANJEAR • ${item.price} PTS`}
                        </Text>
                    </TouchableOpacity>

                    {/* QR Code Expansion */}
                    <Animated.View style={[styles.qrContainer, qrStyle]}>
                        <View style={styles.qrPlaceholder}>
                            <Ionicons name="qr-code-outline" size={100} color="#121212" />
                            <Text style={styles.qrText}>Muestra este código al personal</Text>
                        </View>
                    </Animated.View>

                    {/* Marketing / Distance Text */}
                    {!showQR && (
                        <Text style={styles.marketingText}>
                            Consíguela en {item.restaurants?.name}, a 3 min.
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: width,
        height: height, // Full screen height
        backgroundColor: '#F8F8F8', // Off-white warm background
    },
    imageContainer: {
        width: '100%',
        height: '70%', // 70% of screen as requested
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    priceTag: {
        position: 'absolute',
        top: '55%', // Positioned over the image
        right: 20,
        backgroundColor: '#121212', // Black tag
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        zIndex: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    priceText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '35%', // Overlap slightly with image (100 - 70 = 30, so 35 overlaps)
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 40, // Space for tab bar if needed
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
        justifyContent: 'space-between',
    },
    contentContainer: {
        flex: 1,
    },
    restaurantName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666666',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: '900', // Black weight
        color: '#000000',
        letterSpacing: -1, // Negative tracking
        lineHeight: 36,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '500', // Medium weight
        color: '#121212',
        lineHeight: 24,
    },
    actionContainer: {
        marginTop: 20,
    },
    redeemButton: {
        backgroundColor: '#111111', // Solid Black
        borderRadius: 100, // Pill shape
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginBottom: 12,
    },
    redeemButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    marketingText: {
        textAlign: 'center',
        color: '#666666',
        fontSize: 12,
        fontWeight: '500',
    },
    qrContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F0F0',
        borderRadius: 20,
        overflow: 'hidden',
    },
    qrPlaceholder: {
        padding: 20,
        alignItems: 'center',
    },
    qrText: {
        marginTop: 10,
        color: '#666',
        fontWeight: '500',
    }
});
