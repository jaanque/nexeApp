import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

    return (
        <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
            <View style={styles.headerRow}>
                {/* Location (Left) */}
                <View style={styles.locationContainer}>
                    <TouchableOpacity onPress={() => handlePress(onAddressPress)}>
                        <View style={styles.iconCircle}>
                            <Ionicons name={isPickup ? "basket" : "location"} size={18} color="#000000" />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.addressWrapper}>
                        {/* Mode Toggle */}
                        <View style={styles.modeSwitch}>
                            <TouchableOpacity
                                onPress={() => handleToggle(false)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Text style={[styles.modeText, !isPickup && styles.activeModeText]}>
                                    Entrega
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity
                                onPress={() => handleToggle(true)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Text style={[styles.modeText, isPickup && styles.activeModeText]}>
                                    Recogida
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Address Display */}
                        <TouchableOpacity
                            style={styles.addressRow}
                            onPress={() => !isPickup && handlePress(onAddressPress)}
                            activeOpacity={!isPickup ? 0.7 : 1}
                        >
                             <Text
                                style={styles.addressText}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {isPickup ? "Recogida en tienda" : address}
                            </Text>
                            {!isPickup && <Ionicons name="chevron-down" size={12} color="#000000" />}
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
        paddingHorizontal: 20,
        paddingBottom: 16,
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
    modeSwitch: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
        gap: 8,
    },
    modeText: {
        fontSize: 12,
        color: '#9CA3AF', // Gray 400
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    activeModeText: {
        color: '#111827', // Dark/Black
        fontWeight: '800',
    },
    divider: {
        width: 1,
        height: 10,
        backgroundColor: '#E5E7EB', // Gray 200
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
