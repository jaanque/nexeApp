import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { HomeBanners, HomeCategories, HomeSection, HomeSortChips, Category, MenuItemResult, SortOption } from '@/components/home/HomeSections';
import { Banner } from '@/components/MarketingSlider';

interface HomeHeaderProps {
  address: string;
  isPickup: boolean;
  setIsPickup: (pickup: boolean) => void;
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
  address,
  isPickup,
  setIsPickup,
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
    <View>
      <ModernHeader
        address={address}
        onAddressPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
        onProfilePress={() => router.push('/(tabs)/profile')}
        isPickup={isPickup}
        onTogglePickup={setIsPickup}
      />

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
              title="🔥 Últimas unidades (Vuelan)"
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
    </View>
  );
});

const styles = StyleSheet.create({
  headerContentWrapper: {
    paddingBottom: 0,
  },
});
