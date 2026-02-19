import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Animated, Platform, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Skeleton = ({ width, height, borderRadius, style }: { width: number | string, height: number, borderRadius: number, style?: any }) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: '#F3F4F6', // Light Gray for skeleton pulse
                    opacity,
                },
                style,
            ]}
        />
    );
};

export function HomeScreenSkeleton() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* 1. Header Area - Matches ModernHeader (Flat, White) */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
         <View style={styles.headerTopRow}>
            {/* Address Placeholder (Left) */}
             <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                 <Skeleton width={36} height={36} borderRadius={18} style={{ marginRight: 12 }} />
                 <View style={{ gap: 4 }}>
                     <Skeleton width={80} height={10} borderRadius={4} />
                     <Skeleton width={140} height={14} borderRadius={4} />
                 </View>
             </View>

            {/* Profile Placeholder (Right) */}
            <Skeleton width={40} height={40} borderRadius={20} />
         </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        style={styles.scrollView}
      >
        <View style={styles.contentWrapper}>
            {/* 2. Marketing Slider Skeleton */}
            <View style={styles.sliderContainer}>
              <Skeleton width={SCREEN_WIDTH - 40} height={120} borderRadius={20} />
            </View>

            {/* 3. Categories Skeleton */}
            <View style={styles.categoriesContainer}>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                 {[1, 2, 3, 4, 5, 6].map((i) => (
                    <View key={i} style={{ alignItems: 'center', marginRight: 10 }}>
                        <Skeleton width={100} height={40} borderRadius={16} />
                    </View>
                 ))}
               </ScrollView>
            </View>

            {/* 4. Trending/Rewards Horizontal List Skeleton */}
            <View style={styles.sectionContainer}>
                 <View style={{ paddingHorizontal: 20, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Skeleton width={180} height={20} borderRadius={6} />
                 </View>
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                     {[1, 2, 3].map((i) => (
                         <View key={i} style={{ marginRight: 16 }}>
                             {/* Card Image */}
                             <Skeleton width={SCREEN_WIDTH * 0.7} height={(SCREEN_WIDTH * 0.7) * 0.6} borderRadius={20} style={{ marginBottom: 12 }} />
                             {/* Text Lines */}
                             <Skeleton width={120} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
                             <Skeleton width={80} height={14} borderRadius={4} />
                         </View>
                     ))}
                 </ScrollView>
            </View>

            {/* 5. Restaurant List Skeleton (Grid) */}
            <View style={styles.listContainer}>
                 <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                    <Skeleton width={150} height={20} borderRadius={6} style={{ marginBottom: 12 }} />

                    {/* Filter Chips */}
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Skeleton width={100} height={32} borderRadius={20} />
                        <Skeleton width={80} height={32} borderRadius={20} />
                        <Skeleton width={110} height={32} borderRadius={20} />
                    </View>
                 </View>

                 <View style={styles.gridContainer}>
                     {[1, 2, 3, 4].map((i) => (
                         <View key={i} style={styles.gridItem}>
                             {/* Image Top */}
                             <Skeleton width="100%" height={140} borderRadius={16} style={{ marginBottom: 8 }} />
                             {/* Content Bottom */}
                             <Skeleton width="80%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
                             <Skeleton width="50%" height={12} borderRadius={4} />
                         </View>
                     ))}
                 </View>
            </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Light Background
  },
  headerContainer: {
      paddingHorizontal: 20,
      paddingBottom: 16,
      backgroundColor: '#FFFFFF',
  },
  headerTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  scrollView: {
      backgroundColor: '#FFFFFF',
  },
  contentWrapper: {
      paddingTop: 12, // Reduced top padding
      paddingBottom: 40,
  },
  sliderContainer: {
      alignItems: 'center',
      marginBottom: 24,
      paddingHorizontal: 20,
  },
  categoriesContainer: {
      marginBottom: 32,
  },
  sectionContainer: {
      marginBottom: 32,
  },
  listContainer: {
      width: '100%',
  },
  gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 14, // Matches FlatList padding
  },
  gridItem: {
      width: '50%', // 2 columns
      padding: 6,
      marginBottom: 16,
  }
});
