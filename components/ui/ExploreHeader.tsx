import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ExploreHeaderProps {
    searchQuery: string;
    onSearchChange: (text: string) => void;
    onToggleMap: () => void;
    isMapMode: boolean;
    scrollY: SharedValue<number>;
}

export function ExploreHeader({
    searchQuery,
    onSearchChange,
    onToggleMap,
    isMapMode,
    scrollY
}: ExploreHeaderProps) {
    const insets = useSafeAreaInsets();
    const SCROLL_DISTANCE = 60;

    const handleHaptic = () => {
        if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const animatedContainerStyle = useAnimatedStyle(() => {
        // If map mode, don't collapse fully
        if (isMapMode) {
             return {
                transform: [{ translateY: 0 }],
                paddingTop: insets.top + 6,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderColor: '#E5E7EB',
            };
        }

        const translateY = interpolate(
            scrollY.value,
            [0, SCROLL_DISTANCE],
            [0, -8], // Subtle movement
            Extrapolation.CLAMP
        );

        const borderOpacity = interpolate(
             scrollY.value,
             [0, SCROLL_DISTANCE],
             [0, 1],
             Extrapolation.CLAMP
        );

        return {
            transform: [{ translateY }],
            paddingTop: insets.top + 6,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderColor: `rgba(229, 231, 235, ${borderOpacity})`, // Fade in border
        };
    });

    return (
        <Animated.View style={[styles.container, animatedContainerStyle]}>
            <View style={styles.headerRow}>
                {/* Search Bar - Matching ModernHeader Aesthetic */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#6B7280" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar restaurantes, comida..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={onSearchChange}
                        returnKeyType="search"
                        selectionColor="#111827"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                handleHaptic();
                                onSearchChange('');
                            }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Map Toggle Button - Matching ModernHeader Aesthetic */}
                <TouchableOpacity
                    onPress={() => {
                        handleHaptic();
                        onToggleMap();
                    }}
                    style={[styles.iconButton, isMapMode && styles.activeIconButton]}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name={isMapMode ? "list" : "map"}
                        size={20}
                        color={isMapMode ? "#FFFFFF" : "#111827"}
                    />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16, // Matched Home Header Padding
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        // Removed heavy radius and shadow for flatter look
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6', // Light gray background
        borderRadius: 12, // Slightly more square than full pill
        paddingHorizontal: 12,
        height: 44, // Standard height
    },
    searchInput: {
        flex: 1,
        color: '#111827',
        fontSize: 15,
        fontWeight: '500',
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22, // Circular
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeIconButton: {
        backgroundColor: '#111827',
        borderColor: '#111827',
    }
});
