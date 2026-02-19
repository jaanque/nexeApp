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
    const HEADER_HEIGHT = insets.top + 70;
    const SCROLL_DISTANCE = 60; // Distance to collapse

    const handleHaptic = () => {
        if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const animatedContainerStyle = useAnimatedStyle(() => {
        // If map mode, don't collapse
        if (isMapMode) {
             return {
                transform: [{ translateY: 0 }],
                paddingTop: insets.top + 10,
                paddingBottom: 16,
            };
        }

        const translateY = interpolate(
            scrollY.value,
            [0, SCROLL_DISTANCE],
            [0, -10], // Slight move up
            Extrapolation.CLAMP
        );

        return {
            transform: [{ translateY }],
            paddingTop: insets.top + 10,
            paddingBottom: 16,
        };
    });

    return (
        <Animated.View style={[styles.container, animatedContainerStyle]}>
            <View style={styles.headerRow}>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar restaurantes, comida..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={onSearchChange}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                handleHaptic();
                                onSearchChange('');
                            }}
                        >
                            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Map Toggle Button */}
                <TouchableOpacity
                    onPress={() => {
                        handleHaptic();
                        onToggleMap();
                    }}
                    style={[styles.iconButton, isMapMode && styles.activeIconButton]}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={isMapMode ? "list" : "map"}
                        size={22}
                        color={isMapMode ? "#000" : "#FFF"}
                    />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#121212',
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
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
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 100,
        paddingHorizontal: 16,
        height: 48,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    searchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '500',
    },
    iconButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    activeIconButton: {
        backgroundColor: '#FFFFFF',
    }
});
