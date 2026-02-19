import React, { memo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, ListRenderItem } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { MarketingSlider, Banner } from '@/components/MarketingSlider';
import { CategoryFilterItem } from '@/components/CategoryFilterItem';
import { ModernRewardCard } from '@/components/ModernRewardCard';

// --- Types ---

export interface Category {
  id: number;
  name: string;
  emoji: string;
  color?: string;
}

export interface MenuItemResult {
    id: number;
    name: string;
    description: string;
    price_euros?: number;
    discount_percentage?: number;
    image_url: string;
    restaurant_id: number;
    locales: {
        name: string;
    } | null;
    category_id?: number;
}

export type SortOption = 'default' | 'distance' | 'rating';

// --- Components ---

interface HomeBannersProps {
    banners: Banner[];
}

export const HomeBanners = memo(({ banners }: HomeBannersProps) => {
    return (
        <View style={{ marginTop: 12 }}>
            <MarketingSlider banners={banners} />
        </View>
    );
});

interface HomeCategoriesProps {
    categories: Category[];
    activeCategory: number | null;
    setActiveCategory: (id: number | null) => void;
}

export const HomeCategories = memo(({ categories, activeCategory, setActiveCategory }: HomeCategoriesProps) => {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
            style={{ flexGrow: 0, marginBottom: 24, marginTop: 16 }}
        >
            {categories.map((cat) => (
                <CategoryFilterItem
                    key={cat.id}
                    item={cat}
                    isActive={activeCategory === cat.id}
                    onPress={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                />
            ))}
        </ScrollView>
    );
});

interface HomeSectionProps {
    title: string;
    items: MenuItemResult[];
    showViewAll?: boolean;
    delay?: number;
}

export const HomeSection = memo(({ title, items, showViewAll = true, delay = 100 }: HomeSectionProps) => {
    const router = useRouter();

    const renderItem: ListRenderItem<MenuItemResult> = useCallback(({ item }) => (
        <ModernRewardCard item={item} />
    ), []);

    if (!items || items.length === 0) return null;

    return (
        <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {showViewAll && (
                    <TouchableOpacity style={styles.viewAllButton} onPress={() => router.push('/(tabs)/explore')}>
                        <Text style={styles.viewAllText}>Ver todo</Text>
                        <Ionicons name="arrow-forward" size={16} color="#111827" />
                    </TouchableOpacity>
                )}
            </View>
            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselContent}
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={3}
            />
        </Animated.View>
    );
});

interface HomeSortChipsProps {
    sortBy: SortOption;
    setSortBy: (sort: SortOption) => void;
}

export const HomeSortChips = memo(({ sortBy, setSortBy }: HomeSortChipsProps) => {
    const handleSort = (option: SortOption) => {
        Haptics.selectionAsync();
        setSortBy(option);
    };

    return (
        <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
                <Text style={styles.sectionTitle}>Tiendas en Liquidación</Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsContent}
                style={{ marginBottom: 20 }}
            >
                <TouchableOpacity
                    style={[styles.chip, sortBy === 'default' && styles.activeChip]}
                    onPress={() => handleSort('default')}
                >
                    <Text style={[styles.chipText, sortBy === 'default' && styles.activeChipText]}>Recomendados</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.chip, sortBy === 'distance' && styles.activeChip]}
                    onPress={() => handleSort('distance')}
                >
                    <Ionicons name="location-sharp" size={14} color={sortBy === 'distance' ? '#FFF' : '#374151'} />
                    <Text style={[styles.chipText, sortBy === 'distance' && styles.activeChipText]}>Cerca de mí</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.chip, sortBy === 'rating' && styles.activeChip]}
                    onPress={() => handleSort('rating')}
                >
                    <Ionicons name="star" size={14} color={sortBy === 'rating' ? '#FFF' : '#374151'} />
                    <Text style={[styles.chipText, sortBy === 'rating' && styles.activeChipText]}>Mejor valorados</Text>
                </TouchableOpacity>
            </ScrollView>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    filterContent: {
        paddingHorizontal: 20,
        paddingVertical: 4,
        alignItems: 'center',
    },
    sectionContainer: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.5,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 4,
        opacity: 0.7,
    },
    viewAllText: {
        color: '#111827',
        fontSize: 14,
        fontWeight: '700',
    },
    carouselContent: {
        paddingHorizontal: 20,
        paddingRight: 4,
    },
    chipsContent: {
        paddingHorizontal: 20,
        gap: 10,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 6,
    },
    activeChip: {
        backgroundColor: '#111827',
        borderColor: '#111827',
    },
    chipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    activeChipText: {
        color: '#FFFFFF',
    },
});
