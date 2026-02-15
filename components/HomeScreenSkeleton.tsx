import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from './ui/Skeleton';

export function HomeScreenSkeleton() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      {/* 1. Header */}
      <View style={styles.header}>
        <View>
          <Skeleton width={150} height={24} borderRadius={4} />
          <Skeleton width={100} height={14} borderRadius={4} style={{ marginTop: 8 }} />
        </View>
        <View style={styles.headerRight}>
          <Skeleton width={24} height={24} borderRadius={12} style={{ marginRight: 16 }} />
          <Skeleton width={40} height={40} borderRadius={12} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* 2. Hero Card (Wallet) */}
        <View style={styles.heroContainer}>
          <Skeleton width="100%" height={120} borderRadius={16} />
        </View>

        {/* 3. Search & Filters */}
        <View style={styles.searchSection}>
          <View style={{ paddingHorizontal: 20 }}>
            <Skeleton width="100%" height={56} borderRadius={12} style={{ marginBottom: 16 }} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {[1, 2, 3, 4].map((item) => (
              <Skeleton
                key={item}
                width={100}
                height={36}
                borderRadius={12}
                style={{ marginRight: 10 }}
              />
            ))}
          </ScrollView>
        </View>

        {/* 4. Rewards Active */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Skeleton width={200} height={24} borderRadius={4} />
            <Skeleton width={32} height={32} borderRadius={12} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
            {[1, 2, 3].map((item) => (
              <View key={item} style={styles.rewardCard}>
                <Skeleton width="100%" height={160} borderRadius={16} style={{ marginBottom: 12 }} />
                <Skeleton width="70%" height={20} borderRadius={4} style={{ marginBottom: 4 }} />
                <Skeleton width="50%" height={16} borderRadius={4} />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 5. Comercios Nexe */}
        <View style={styles.sectionContainer}>
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
             <Skeleton width={180} height={24} borderRadius={4} />
          </View>
          <View style={styles.listContainer}>
            {[1, 2, 3, 4, 5].map((item) => (
              <View key={item} style={styles.businessRow}>
                <Skeleton width={50} height={50} borderRadius={12} style={{ marginRight: 16 }} />
                <View style={{ flex: 1 }}>
                  <Skeleton width="60%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
                  <Skeleton width="40%" height={14} borderRadius={4} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchSection: {
    marginBottom: 32,
  },
  filterScroll: {
    paddingLeft: 20,
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
  carouselContent: {
    paddingHorizontal: 20,
    paddingRight: 4,
  },
  rewardCard: {
    width: 280,
    marginRight: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
});
