import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { interpolate, Extrapolation, useAnimatedStyle, SharedValue, useDerivedValue } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface ModernHeaderProps {
    greeting: string;
    points: number;
    initials: string;
    isGuest: boolean;
    onWalletPress: () => void;
    onProfilePress: () => void;
    scrollY: SharedValue<number>;
}

export function ModernHeader({
    greeting,
    points,
    initials,
    isGuest,
    onWalletPress,
    onProfilePress,
    scrollY
}: ModernHeaderProps) {
    const insets = useSafeAreaInsets();

    const handlePress = (action: () => void) => {
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        action();
    };

    const formattedPoints = points.toLocaleString('es-ES');

    // Derived values for animations
    const headerHeight = useDerivedValue(() => {
        return interpolate(
            scrollY.value,
            [0, 100],
            [insets.top + 80, insets.top + 60], // Collapses slightly
            Extrapolation.CLAMP
        );
    });

    const blurIntensity = useDerivedValue(() => {
        return interpolate(
            scrollY.value,
            [0, 50],
            [0, 80], // Becomes blurry quickly
            Extrapolation.CLAMP
        );
    });

    const contentOpacity = useDerivedValue(() => {
        return interpolate(
            scrollY.value,
            [0, 50],
            [1, 0], // Greeting fades out
            Extrapolation.CLAMP
        );
    });

    const containerStyle = useAnimatedStyle(() => {
        return {
            height: headerHeight.value,
            backgroundColor: interpolate(
                scrollY.value,
                [0, 100],
                ['rgba(18,18,18,0)', 'rgba(18,18,18,0.8)'], // Transparent to semi-transparent dark
                Extrapolation.CLAMP
            )
        };
    });

    const greetingStyle = useAnimatedStyle(() => {
        return {
            opacity: contentOpacity.value,
            transform: [
                { translateY: interpolate(scrollY.value, [0, 50], [0, -10], Extrapolation.CLAMP) }
            ]
        };
    });

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            {Platform.OS === 'ios' && (
                <AnimatedBlurView
                    intensity={blurIntensity}
                    tint="dark"
                    style={StyleSheet.absoluteFill}
                />
            )}

            <View style={[styles.contentRow, { paddingTop: insets.top }]}>
                {/* Profile Avatar */}
                <TouchableOpacity
                    onPress={() => handlePress(onProfilePress)}
                    style={styles.profileButton}
                    activeOpacity={0.8}
                >
                     {isGuest ? (
                         <Ionicons name="person" size={18} color="#121212" />
                     ) : (
                         <Text style={styles.initials}>{initials}</Text>
                     )}
                </TouchableOpacity>

                {/* Greeting Text - Fades Out */}
                <Animated.View style={[styles.greetingContainer, greetingStyle]}>
                    <Text style={styles.greetingText} numberOfLines={1} adjustsFontSizeToFit>
                        {greeting}
                    </Text>
                </Animated.View>

                {/* Points Pill - Always Visible */}
                <TouchableOpacity
                    onPress={() => handlePress(onWalletPress)}
                    style={styles.pointsPill}
                    activeOpacity={0.7}
                >
                     <Ionicons name="star" size={12} color="#F59E0B" style={{marginRight: 4}} />
                     <Text style={styles.pointsText}>{formattedPoints}</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        overflow: 'hidden',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    contentRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 10,
        gap: 12,
    },
    profileButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3F4F6', // Light background for contrast
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)', // Subtle border
    },
    initials: {
        fontSize: 14,
        fontWeight: '700',
        color: '#121212',
    },
    greetingContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    greetingText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: -0.3,
    },
    pointsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    pointsText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
