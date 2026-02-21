import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { HomeBanners, HomeCategories, HomeSection, HomeSortChips, Category, MenuItemResult, SortOption } from '@/components/home/HomeSections';
import { Banner } from '@/components/MarketingSlider';

interface HomeHeaderProps {
  banners: Banner[];
  categories: Category[];
  activeCategory: number | null;
  setActiveCategory: (id: number | null) => void;
  trendingItems: MenuItemResult[];
  rewardItems: MenuItemResult[];
  sortBy: SortOption;
  setSortBy: (option: SortOption) => void;
  isFiltering: boolean;
}

export const HomeHeader = memo(({
  banners,
  categories,
  activeCategory,
  setActiveCategory,
  trendingItems,
  rewardItems,
  sortBy,
  setSortBy,
  isFiltering,
}: HomeHeaderProps) => {
  const router = useRouter();

  return (
    <View style={styles.headerContentWrapper}>
        <HomeBanners banners={banners} />

        <HomeCategories
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />

        <View style={{ opacity: isFiltering ? 0.5 : 1 }}>
          {trendingItems.length > 0 && (
            <HomeSection
              title="🔥 Últimas unidades"
              items={trendingItems}
              delay={100}
            />
          )}

          {rewardItems.length > 0 && (
            <HomeSection
              title="Liquidación Total"
              items={rewardItems}
              delay={100}
            />
          )}

          <HomeSortChips
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
        </View>
    </View>
  );
});

const styles = StyleSheet.create({
  headerContentWrapper: {
    paddingBottom: 0,
    marginTop: 10, // Add a bit of space below the sticky header
  },
});
