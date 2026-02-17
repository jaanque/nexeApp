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
    onScanPress: () => void;
    onWalletPress: () => void;
    onProfilePress: () => void;
    onSearchPress: () => void;
}

export function ModernHeader({
    greeting,
    points,
    initials,
    isGuest,
    onScanPress,
    onWalletPress,
    onProfilePress,
    onSearchPress
}: ModernHeaderProps) {
    const insets = useSafeAreaInsets();

    const handlePress = (action: () => void) => {
        if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        action();
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
            {/* Top Row: Greeting & Profile */}
            <View style={styles.topRow}>
                <View style={styles.greetingContainer}>
                    <Text style={styles.greetingText}>{greeting}</Text>
                    <TouchableOpacity onPress={() => handlePress(onWalletPress)} style={styles.pointsPill}>
                         <Ionicons name="star" size={14} color="#F59E0B" style={{marginRight: 4}} />
                         <Text style={styles.pointsText}>{points} pts</Text>
                         <Ionicons name="chevron-forward" size={12} color="#9CA3AF" style={{marginLeft: 2}} />
                    </TouchableOpacity>
                </View>

                <View style={styles.actionsContainer}>
                     <TouchableOpacity onPress={() => handlePress(onSearchPress)} style={styles.iconButton}>
                        <Ionicons name="search" size={22} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handlePress(onProfilePress)} style={styles.profileButton}>
                         {isGuest ? (
                             <Ionicons name="person" size={20} color="#163D36" />
                         ) : (
                             <Text style={styles.initials}>{initials}</Text>
                         )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bottom Row: Scan Button (Full Width, Prominent) */}
            <View style={styles.bottomRow}>
                <TouchableOpacity
                    style={styles.scanButton}
                    onPress={() => handlePress(onScanPress)}
                    activeOpacity={0.9}
                >
                    <View style={styles.scanContent}>
                        <Ionicons name="receipt-outline" size={20} color="#163D36" style={{ marginRight: 8 }} />
                        <Text style={styles.scanText}>Escanear tiquet</Text>
                    </View>
                     <View style={styles.scanBadge}>
                        <Ionicons name="camera-outline" size={12} color="#fff" />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#121212',
        paddingHorizontal: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    greetingContainer: {
        flex: 1,
        marginRight: 16,
    },
    greetingText: {
        fontSize: 28,
        fontWeight: '800', // Heavy bold
        color: '#FFFFFF',
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    pointsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    pointsText: {
        color: '#E5E7EB', // Gray 200
        fontSize: 14,
        fontWeight: '600',
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F3F4F6', // Light background for contrast
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#163D36', // Brand color border
    },
    initials: {
        fontSize: 18,
        fontWeight: '700',
        color: '#163D36',
    },
    bottomRow: {
        marginTop: 4,
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        paddingVertical: 12, // Reduced from 14 for a lighter feel
        paddingHorizontal: 16,
        borderRadius: 20, // Modern rounded shape
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    scanContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scanText: {
        color: '#163D36',
        fontSize: 16,
        fontWeight: '700',
    },
    scanBadge: {
        backgroundColor: '#163D36',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
