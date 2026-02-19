import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ModernHeaderProps {
    address: string;
    onAddressPress: () => void;
    onWalletPress: () => void;
    onProfilePress: () => void;
}

export function ModernHeader({
    address,
    onAddressPress,
    onWalletPress,
    onProfilePress,
}: ModernHeaderProps) {
    const insets = useSafeAreaInsets();

    const handlePress = (action: () => void) => {
        if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        action();
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
            <View style={styles.headerRow}>
                {/* Location (Left) */}
                <TouchableOpacity
                    onPress={() => handlePress(onAddressPress)}
                    style={styles.locationContainer}
                    activeOpacity={0.7}
                >
                    <View style={styles.iconCircle}>
                        <Ionicons name="location" size={18} color="#000000" />
                    </View>

                    <View style={styles.addressWrapper}>
                        <Text style={styles.label}>Ubicación actual</Text>
                        <View style={styles.addressRow}>
                             <Text
                                style={styles.addressText}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {address}
                            </Text>
                            <Ionicons name="chevron-down" size={12} color="#000000" />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Right Actions Group */}
                <View style={styles.rightActions}>
                    {/* Profile Button */}
                    <TouchableOpacity
                        onPress={() => handlePress(onProfilePress)}
                        activeOpacity={0.7}
                        style={styles.profileButton}
                    >
                         <Ionicons name="person" size={20} color="#000000" />
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
        // No absolute positioning, no shadows
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 16,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3F4F6', // Light gray circle
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    addressWrapper: {
        flex: 1,
        justifyContent: 'center',
    },
    label: {
        fontSize: 11,
        color: '#6B7280', // Gray 500
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    addressText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827', // Gray 900 (almost black)
        letterSpacing: -0.3,
        maxWidth: '90%',
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
});
