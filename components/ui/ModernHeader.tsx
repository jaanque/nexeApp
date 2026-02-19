import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ModernHeaderProps {
    address: string;
    onAddressPress: () => void;
    onProfilePress: () => void;
    isPickup?: boolean;
    onTogglePickup?: (value: boolean) => void;
}

export function ModernHeader({
    address,
    onAddressPress,
    onProfilePress,
    isPickup = false,
    onTogglePickup,
}: ModernHeaderProps) {
    const insets = useSafeAreaInsets();

    // Animation value (0 for Delivery, 1 for Pickup)
    const togglePosition = useSharedValue(isPickup ? 1 : 0);

    useEffect(() => {
        togglePosition.value = withSpring(isPickup ? 1 : 0, { damping: 15, stiffness: 120 });
    }, [isPickup]);

    const handlePress = (action: () => void) => {
        if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        action();
    };

    const handleToggle = (value: boolean) => {
        if (onTogglePickup && isPickup !== value) {
            if (process.env.EXPO_OS === 'ios') Haptics.selectionAsync();
            onTogglePickup(value);
        }
    };

    // Animated Style for the sliding indicator
    const animatedIndicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: togglePosition.value * 90 }], // Assuming button width ~90
        };
    });

    return (
        <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
            <View style={styles.headerRow}>
                {/* Location Icon & Address (Top Left) */}
                <View style={styles.leftGroup}>
                     <TouchableOpacity
                        onPress={() => !isPickup && handlePress(onAddressPress)}
                        activeOpacity={!isPickup ? 0.7 : 1}
                        style={styles.addressContainer}
                    >
                        <View style={styles.iconCircle}>
                            <Ionicons name="location" size={18} color="#111827" />
                        </View>
                        <View>
                            <Text style={styles.subtitle}>Ubicación actual</Text>
                            <View style={styles.addressRow}>
                                <Text
                                    style={styles.addressText}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {isPickup ? "Recogida en tienda" : address}
                                </Text>
                                {!isPickup && <Ionicons name="chevron-down" size={12} color="#111827" style={{ marginLeft: 4 }} />}
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Right Actions Group: Profile */}
                <View style={styles.rightActions}>
                    <TouchableOpacity
                        onPress={() => handlePress(onProfilePress)}
                        activeOpacity={0.7}
                        style={styles.profileButton}
                    >
                         <Ionicons name="person" size={20} color="#111827" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Mode Toggle (Bottom Row - Full Width / Centered) */}
            <View style={styles.toggleContainer}>
                {/* Background Track */}
                <View style={styles.toggleTrack}>
                    {/* Animated Sliding Indicator */}
                    <Animated.View style={[styles.activeIndicator, animatedIndicatorStyle]} />

                    {/* Delivery Option */}
                    <TouchableOpacity
                        style={styles.toggleOption}
                        onPress={() => handleToggle(false)}
                        activeOpacity={0.9}
                    >
                        <Ionicons
                            name="bicycle"
                            size={16}
                            color={!isPickup ? "#111827" : "#6B7280"}
                            style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.toggleText, !isPickup && styles.activeToggleText]}>
                            Entrega
                        </Text>
                    </TouchableOpacity>

                    {/* Pickup Option */}
                    <TouchableOpacity
                        style={styles.toggleOption}
                        onPress={() => handleToggle(true)}
                        activeOpacity={0.9}
                    >
                        <Ionicons
                            name="bag-handle"
                            size={16}
                            color={isPickup ? "#111827" : "#6B7280"}
                            style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.toggleText, isPickup && styles.activeToggleText]}>
                            Recogida
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF', // Clean white background
        paddingHorizontal: 20,
        paddingBottom: 16,
        gap: 16, // Space between address row and toggle row
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftGroup: {
        flex: 1,
        marginRight: 16,
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6', // Light gray circle
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    subtitle: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 2,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addressText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827', // Gray 900 (almost black)
        letterSpacing: -0.3,
        maxWidth: 200,
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6', // Light gray
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Toggle Styles
    toggleContainer: {
        alignItems: 'center', // Center the toggle
    },
    toggleTrack: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 24,
        padding: 4,
        height: 48,
        width: 190, // Fixed width for predictable animation (90 * 2 + padding)
        position: 'relative',
    },
    activeIndicator: {
        position: 'absolute',
        top: 4,
        left: 4,
        width: 90,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    toggleOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1, // Ensure text is above indicator
    },
    toggleText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeToggleText: {
        color: '#111827',
        fontWeight: '700',
    },
});
