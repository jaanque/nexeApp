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
        <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
            <View style={styles.contentRow}>
                {/* Profile Avatar */}
                <TouchableOpacity
                    onPress={() => handlePress(onProfilePress)}
                    style={styles.profileButton}
                    activeOpacity={0.8}
                >
                     {isGuest ? (
                         <Ionicons name="person" size={24} color="#121212" />
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
                     <Ionicons name="star" size={16} color="#F59E0B" style={{marginRight: 6}} />
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
        paddingBottom: 40, // Increased bottom padding for overlap
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    profileButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6', // Light background for contrast
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)', // Subtle border
    },
    initials: {
        fontSize: 18,
        fontWeight: '700',
        color: '#121212',
    },
    greetingContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    greetingText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    pointsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    pointsText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
