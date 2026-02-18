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
                    backgroundColor: '#E5E7EB',
                    opacity,
                },
                style,
            ]}
        />
    );
};

export function HomeScreenSkeleton() {
  const insets = useSafeAreaInsets();
  const HEADER_HEIGHT = insets.top + 60;

  return (
    <View style={styles.container}>
      {/* 1. Header Area - ModernHeader Match */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 12 }]}>
         <View style={styles.headerTopRow}>
            {/* Address Placeholder */}
             <View style={{ gap: 4 }}>
                 <Skeleton width={80} height={14} borderRadius={4} style={{ backgroundColor: '#333' }} />
                 <Skeleton width={180} height={20} borderRadius={6} style={{ backgroundColor: '#333' }} />
             </View>

            {/* Points Pill Placeholder */}
            <Skeleton width={90} height={36} borderRadius={20} style={{ backgroundColor: '#333' }} />
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
                    <View key={i} style={{ alignItems: 'center', marginRight: 16 }}>
                        <Skeleton width={72} height={72} borderRadius={24} style={{ marginBottom: 8 }} />
                        <Skeleton width={50} height={10} borderRadius={4} />
                    </View>
                 ))}
               </ScrollView>
            </View>

            {/* 4. Trending Section Skeleton */}
            <View style={styles.sectionContainer}>
                 <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                    <Skeleton width={200} height={24} borderRadius={6} />
                 </View>
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                     {[1, 2, 3].map((i) => (
                         <View key={i} style={{ marginRight: 16 }}>
                             <Skeleton width={SCREEN_WIDTH * 0.7} height={(SCREEN_WIDTH * 0.7) * 0.6} borderRadius={20} style={{ marginBottom: 12 }} />
                             <Skeleton width={120} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
                             <Skeleton width={180} height={14} borderRadius={4} />
                         </View>
                     ))}
                 </ScrollView>
            </View>

             {/* 5. Rewards Section Skeleton */}
             <View style={styles.sectionContainer}>
                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 }}>
                    <Skeleton width={150} height={24} borderRadius={6} />
                    <Skeleton width={60} height={16} borderRadius={4} />
                 </View>
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                     {[1, 2].map((i) => (
                         <View key={i} style={{ marginRight: 16 }}>
                             <Skeleton width={SCREEN_WIDTH * 0.7} height={(SCREEN_WIDTH * 0.7) * 0.6} borderRadius={20} style={{ marginBottom: 12 }} />
                             <Skeleton width={100} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
                             <Skeleton width={160} height={14} borderRadius={4} />
                         </View>
                     ))}
                 </ScrollView>
            </View>

            {/* 6. Restaurant List Skeleton */}
            <View style={styles.listContainer}>
                 <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                    <Skeleton width={180} height={24} borderRadius={6} style={{ marginBottom: 12 }} />

                    {/* Filter Chips */}
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Skeleton width={100} height={32} borderRadius={20} />
                        <Skeleton width={80} height={32} borderRadius={20} />
                        <Skeleton width={110} height={32} borderRadius={20} />
                    </View>
                 </View>

                 {[1, 2].map((i) => (
                     <View key={i} style={styles.cardContainer}>
                         <Skeleton width="100%" height={240} borderRadius={24} style={{ marginBottom: 0 }} />
                         {/* We simulate the overlay text with positioned absolute skeletons if we wanted precise matching,
                             but for a general loading state, a simple card block is often cleaner.
                             Let's add a small 'content' block below to simulate the text area if it wasn't overlay.
                             Actually, ModernBusinessCard has overlay text. So a big block is fine.
                         */}
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
    backgroundColor: '#121212', // Match Main Background
  },
  headerContainer: {
      paddingHorizontal: 20,
      paddingBottom: 24,
      backgroundColor: '#121212',
      zIndex: 10,
  },
  headerTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  scrollView: {
      backgroundColor: '#121212',
  },
  contentWrapper: {
      backgroundColor: '#F9FAFB', // Light Sheet
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingTop: 24,
      paddingBottom: 40,
      minHeight: 800, // Ensure it fills screen
      marginTop: -12,
  },
  sliderContainer: {
      alignItems: 'center',
      marginBottom: 32,
      paddingHorizontal: 20,
  },
  categoriesContainer: {
      marginBottom: 40,
  },
  sectionContainer: {
      marginBottom: 40,
  },
  listContainer: {
      width: '100%',
  },
  cardContainer: {
      marginBottom: 24,
      marginHorizontal: 20,
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: '#fff', // Or skeleton color
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
  }
});
