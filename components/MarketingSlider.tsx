import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

export interface Banner {
  id: number;
  image_url: string;
  title: string;
  subtitle?: string;
  deep_link?: string;
}

interface MarketingSliderProps {
  banners: Banner[];
}

export function MarketingSlider({ banners }: MarketingSliderProps) {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { width: windowWidth } = useWindowDimensions();
  const isUserInteracting = useRef(false); // Ref to track user interaction
  const CARD_MARGIN = 20;

  // Auto-scroll logic
  useEffect(() => {
    if (!banners || banners.length <= 1) return;

    const interval = setInterval(() => {
      if (isUserInteracting.current) return; // Skip if user is interacting

      let nextIndex = currentIndex + 1;
      if (nextIndex >= banners.length) {
        nextIndex = 0;
      }
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [currentIndex, banners.length]);

  const handleScrollBeginDrag = () => {
      isUserInteracting.current = true;
  };

  const handleScrollEndDrag = () => {
      // Re-enable auto-scroll after a short delay
      setTimeout(() => {
          isUserInteracting.current = false;
      }, 3000);
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / windowWidth);

    if (index !== currentIndex && index >= 0 && index < banners.length) {
      setCurrentIndex(index);
      // Trigger haptics only if user was interacting (or just finished dragging)
      if (isUserInteracting.current) {
          Haptics.selectionAsync();
      }
    }

    // Reset interaction flag after momentum ends if needed, but the timeout above handles the "pause" better
  };

  const handlePress = (banner: Banner) => {
    Haptics.selectionAsync();
    if (banner.deep_link) {
      router.push(banner.deep_link as any);
    }
  };

  if (!banners || banners.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => handlePress(item)}
            style={{ width: windowWidth, paddingHorizontal: CARD_MARGIN, alignItems: 'center' }}
          >
            <View style={styles.card}>
                <Image
                    source={{ uri: item.image_url }}
                    style={styles.image}
                    contentFit="cover"
                    transition={500}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
                    style={styles.gradient}
                >
                    <View style={styles.textContainer}>
                        <Text style={styles.subtitle}>{item.subtitle}</Text>
                        <Text style={styles.title}>{item.title}</Text>
                    </View>
                </LinearGradient>
            </View>
          </TouchableOpacity>
        )}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.list}
      />

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {banners.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32, // Increased spacing
  },
  list: {
      flexGrow: 0,
  },
  card: {
    width: '100%',
    height: 200, // Slightly taller for premium feel
    borderRadius: 24, // Matches iOS standard for large cards
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 }, // Deeper shadow
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%', // Higher gradient for better text legibility
    justifyContent: 'flex-end',
    padding: 20,
  },
  textContainer: {
      gap: 6,
  },
  title: {
    color: 'white',
    fontSize: 24, // Larger title
    fontWeight: '800',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: '#E0E0E0',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.9,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#121212',
  },
  inactiveDot: {
    width: 6,
    backgroundColor: '#D1D5DB', // Gray 300
  },
});
