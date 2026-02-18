import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image as RNImage } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface ModernHeaderProps {
    greeting: string;
    points: number;
    initials: string;
    isGuest: boolean;
    onWalletPress: () => void;
    onProfilePress: () => void;
}

export function ModernHeader({
    greeting,
    points,
    initials,
    isGuest,
    onWalletPress,
    onProfilePress
}: ModernHeaderProps) {
    const insets = useSafeAreaInsets();

    const handlePress = (action: () => void) => {
        if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        action();
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
            <View style={styles.contentRow}>
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

                {/* Greeting Text */}
                <View style={styles.greetingContainer}>
                    <Text style={styles.greetingText} numberOfLines={1} adjustsFontSizeToFit>
                        {greeting}
                    </Text>
                </View>

                {/* Points Pill */}
                <TouchableOpacity
                    onPress={() => handlePress(onWalletPress)}
                    style={styles.pointsPill}
                    activeOpacity={0.7}
                >
                     <Ionicons name="star" size={12} color="#F59E0B" style={{marginRight: 4}} />
                     <Text style={styles.pointsText}>{points}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#121212',
        paddingHorizontal: 20,
        paddingBottom: 16, // Reduced bottom padding (Compact)
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
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
