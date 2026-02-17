import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from './ui/Skeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function HomeScreenSkeleton() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* 1. Header Area (Approx matching ModernHeader) */}
      <View style={[styles.headerContainer, { height: 200, paddingTop: insets.top + 10 }]}>
         <View style={styles.headerTopRow}>
            {/* Avatar Skeleton */}
            <Skeleton width={44} height={44} borderRadius={16} style={{ backgroundColor: '#2C2C2E' }} />
            <View style={styles.headerActions}>
                {/* Icons */}
                <Skeleton width={44} height={44} borderRadius={16} style={{ marginRight: 12, backgroundColor: '#2C2C2E' }} />
                <Skeleton width={44} height={44} borderRadius={16} style={{ backgroundColor: '#2C2C2E' }} />
            </View>
         </View>
         <View style={styles.headerContent}>
             <Skeleton width={150} height={20} borderRadius={4} style={{ marginBottom: 12, backgroundColor: '#2C2C2E' }} />
             <Skeleton width={100} height={36} borderRadius={8} style={{ backgroundColor: '#2C2C2E' }} />
         </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* 2. Marketing Slider Skeleton */}
        <View style={styles.sliderContainer}>
          <Skeleton width={SCREEN_WIDTH - 40} height={200} borderRadius={24} />
        </View>

        {/* 3. Promotions Skeleton (New) */}
        <View style={styles.sectionContainer}>
             <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                <Skeleton width={140} height={24} borderRadius={4} />
             </View>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20 }}>
                 {[1, 2].map(i => (
                     <View key={i} style={{ marginRight: 16 }}>
                        <Skeleton width={SCREEN_WIDTH * 0.75} height={160} borderRadius={24} />
                     </View>
                 ))}
             </ScrollView>
        </View>

        {/* 4. Categories Skeleton */}
        <View style={styles.categoriesContainer}>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20 }}>
             {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={{ alignItems: 'center', marginRight: 20 }}>
                    <Skeleton width={64} height={64} borderRadius={24} style={{ marginBottom: 8 }} />
                    <Skeleton width={50} height={12} borderRadius={4} />
                </View>
             ))}
           </ScrollView>
        </View>

        {/* 5. Restaurant List Skeleton */}
        <View style={styles.listContainer}>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 }}>
                <Skeleton width={150} height={24} borderRadius={4} />
                <Skeleton width={60} height={20} borderRadius={4} />
             </View>
             {[1, 2, 3].map((i) => (
                 <View key={i} style={styles.cardContainer}>
                     <Skeleton width="100%" height={200} borderRadius={16} style={{ marginBottom: 12 }} />
                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Skeleton width="60%" height={20} borderRadius={4} />
                        <Skeleton width={40} height={20} borderRadius={4} />
                     </View>
                     <Skeleton width="40%" height={16} borderRadius={4} />
                 </View>
             ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerContainer: {
      backgroundColor: '#121212', // Dark background for skeleton to match header
      paddingHorizontal: 24,
      justifyContent: 'flex-start',
  },
  headerTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
  },
  headerActions: {
      flexDirection: 'row',
  },
  headerContent: {
      justifyContent: 'center',
  },
  sliderContainer: {
      marginTop: 24,
      alignItems: 'center',
      marginBottom: 32,
  },
  sectionContainer: {
      marginBottom: 32,
  },
  categoriesContainer: {
      marginBottom: 32,
  },
  listContainer: {
      width: '100%',
      paddingHorizontal: 24,
  },
  cardContainer: {
      marginBottom: 20,
      backgroundColor: '#fff',
      padding: 16,
      borderRadius: 16, // Match new card radius
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
  }
});
