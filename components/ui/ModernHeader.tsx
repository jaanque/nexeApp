import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { Extrapolation, interpolate, runOnJS, SharedValue, useAnimatedReaction, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ModernHeaderProps {
    address: string;
    points: number;
    onAddressPress: () => void;
    onWalletPress: () => void;
    onProfilePress: () => void;
    scrollY: SharedValue<number>;
}

export function ModernHeader({
    address,
    points,
    onAddressPress,
    onWalletPress,
    onProfilePress,
    scrollY
}: ModernHeaderProps) {
    const insets = useSafeAreaInsets();
    // Calculate the full height of the header including safe area
    // Increased height slightly to accommodate potentially 2 lines of address
    const HEADER_HEIGHT = insets.top + 80;
    const COLLAPSE_THRESHOLD = 80; // Scroll distance to trigger full collapse

    const handlePress = (action: () => void) => {
        if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        action();
    };

    const triggerHaptic = () => {
        if (process.env.EXPO_OS === 'ios') {
             Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    useAnimatedReaction(
        () => scrollY.value > COLLAPSE_THRESHOLD,
        (isCollapsed, prevIsCollapsed) => {
            if (isCollapsed !== prevIsCollapsed) {
                runOnJS(triggerHaptic)();
            }
        },
        [scrollY]
    );

    const animatedContainerStyle = useAnimatedStyle(() => {
        const translateY = interpolate(
            scrollY.value,
            [0, COLLAPSE_THRESHOLD],
            [0, -HEADER_HEIGHT],
            Extrapolation.CLAMP
        );

        const opacity = interpolate(
            scrollY.value,
            [0, COLLAPSE_THRESHOLD * 0.8], // Fade out slightly before full collapse
            [1, 0],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ translateY }],
            opacity,
            paddingTop: insets.top + 10,
            paddingBottom: 16,
        };
    });

    const formattedPoints = points.toLocaleString('es-ES');

    return (
        <Animated.View style={[styles.container, animatedContainerStyle]}>
            <View style={styles.headerRow}>
                {/* Location Pill (Left) - Minimalist & Rounded */}
                <TouchableOpacity
                    onPress={() => handlePress(onAddressPress)}
                    style={styles.locationPill}
                    activeOpacity={0.7}
                >
                    <View style={styles.iconCircle}>
                        <Ionicons name="location" size={18} color="#000" />
                    </View>

                    <View style={styles.addressContainer}>
                        <Text
                            style={styles.addressText}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                        >
                            {address}
                        </Text>
                    </View>

                    <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.6)" style={{ marginRight: 4 }} />
                </TouchableOpacity>

                {/* Right Actions Group */}
                <View style={styles.rightActions}>
                    {/* Points Pill */}
                    <TouchableOpacity
                        onPress={() => handlePress(onWalletPress)}
                        style={styles.pointsPill}
                        activeOpacity={0.7}
                    >
                         <Ionicons name="star" size={14} color="#FFD700" style={{marginRight: 6}} />
                         <Text style={styles.pointsText}>{formattedPoints}</Text>
                    </TouchableOpacity>

                    {/* Profile Button - Circular */}
                    <TouchableOpacity
                        onPress={() => handlePress(onProfilePress)}
                        activeOpacity={0.7}
                        style={styles.profileButton}
                    >
                         <Ionicons name="person" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#121212',
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 50,
    },
    // Location Pill Styles
    locationPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 100,
        padding: 4,
        paddingRight: 12,
        flex: 1,
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    addressContainer: {
        flex: 1,
        marginLeft: 10,
        justifyContent: 'center',
    },
    addressText: {
        fontSize: 13, // Slightly smaller for better fit with 2 lines
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: -0.2,
        lineHeight: 16,
    },

    // Right Actions Styles
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    pointsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        height: 40,
        paddingHorizontal: 14,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    pointsText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    profileButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
});
