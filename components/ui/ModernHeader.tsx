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
    const HEADER_HEIGHT = insets.top + 76;
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
            <View style={styles.contentRow}>
                {/* Location Selector (Left) */}
                <TouchableOpacity
                    onPress={() => handlePress(onAddressPress)}
                    style={styles.locationButton}
                    activeOpacity={0.7}
                >
                    <Ionicons name="location-sharp" size={20} color="#FF4B4B" style={{ marginRight: 8 }} />
                    <View style={styles.addressContainer}>
                        <Text style={styles.addressLabel}>Entregar en ▾</Text>
                        <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="tail">
                            {address}
                        </Text>
                    </View>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {/* Points Pill (Right) */}
                    <TouchableOpacity
                        onPress={() => handlePress(onWalletPress)}
                        style={styles.pointsPill}
                        activeOpacity={0.7}
                    >
                         <Ionicons name="star" size={14} color="#F59E0B" style={{marginRight: 6}} />
                         <Text style={styles.pointsText}>{formattedPoints} Pts</Text>
                    </TouchableOpacity>

                    {/* Profile Button */}
                    <TouchableOpacity
                        onPress={() => handlePress(onProfilePress)}
                        activeOpacity={0.7}
                        style={styles.profileButton}
                    >
                         <Ionicons name="person-circle-outline" size={28} color="rgba(255,255,255,0.8)" />
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
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 50, // Slightly taller for two-line text
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 16,
    },
    addressContainer: {
        justifyContent: 'center',
        flex: 1,
    },
    addressLabel: {
        fontSize: 11,
        color: '#9CA3AF', // Gray 400
        fontWeight: '500',
        marginBottom: 2,
    },
    addressText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: -0.3,
        maxWidth: '90%', // Prevent overflow
    },
    pointsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    pointsText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    profileButton: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
