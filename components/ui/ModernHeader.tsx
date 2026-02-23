import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ModernHeaderProps {
    address: string;
    onAddressPress: () => void;
    onProfilePress: () => void;
}

export function ModernHeader({
    address,
    onAddressPress,
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
                <View style={styles.locationContainer}>
                    <TouchableOpacity onPress={() => handlePress(onAddressPress)}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="location" size={20} color="#000000" />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.addressWrapper}>
                        <TouchableOpacity
                            style={styles.addressRow}
                            onPress={() => handlePress(onAddressPress)}
                            activeOpacity={0.7}
                        >
                             <Text
                                style={styles.addressText}
                                numberOfLines={2}
                                ellipsizeMode="tail"
                            >
                                {address}
                            </Text>
                            <Ionicons name="chevron-down" size={12} color="#000000" />
                        </TouchableOpacity>
                    </View>
                </View>

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
        paddingHorizontal: 24,
        paddingBottom: 16, // Increased padding
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
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6', // Light gray circle
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    addressWrapper: {
        flex: 1,
        justifyContent: 'center',
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    addressText: {
        fontSize: 16, // Slightly larger
        fontWeight: '700', // Bolder
        color: '#111827',
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
