import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface ModernHeaderProps {
    greeting?: string; // Optional now, likely unused
    points: number;
    initials: string;
    isGuest: boolean;
    onWalletPress: () => void;
    onProfilePress: () => void;
}

export function ModernHeader({
    points,
    initials,
    isGuest,
    onWalletPress,
    onProfilePress,
}: ModernHeaderProps) {
    const insets = useSafeAreaInsets();

    const handlePress = (action: () => void) => {
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        action();
    };

    const formattedPoints = points.toLocaleString('es-ES');

    return (
        <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
            {/* Left: Avatar "Island" */}
            <TouchableOpacity
                onPress={() => handlePress(onProfilePress)}
                style={styles.avatarIsland}
                activeOpacity={0.8}
            >
                 {isGuest ? (
                     <Ionicons name="person" size={20} color="#121212" />
                 ) : (
                     <Text style={styles.initials}>{initials}</Text>
                 )}
            </TouchableOpacity>

            {/* Right: Points Pill "Island" */}
            <TouchableOpacity
                onPress={() => handlePress(onWalletPress)}
                style={styles.pointsIsland}
                activeOpacity={0.7}
            >
                 <Text style={styles.pointsText}>{formattedPoints} pts.</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 10,
        // No background color, elements float
    },
    avatarIsland: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF', // White circle for avatar
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    initials: {
        fontSize: 16,
        fontWeight: '700',
        color: '#121212',
    },
    pointsIsland: {
        backgroundColor: '#121212', // Solid Black
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 30, // Pill shape
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    pointsText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});
