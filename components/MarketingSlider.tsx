import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity, FlatList, Platform, ViewToken } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { getOptimizedImageSource } from '@/lib/imageOptimization';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  runOnJS,
  SharedValue
} from 'react-native-reanimated';

export interface Banner {
  id: number;
  image_url: string;
  title: string;
  subtitle?: string;
  description?: string;
  deep_link?: string;
}

interface MarketingSliderProps {
  banners: Banner[];
}

interface BannerItemProps {
  item: Banner;
  index: number;
  scrollX: SharedValue<number>;
  windowWidth: number;
  cardHeight: number;
  onPress: () => void;
}

interface PaginationProps {
  banners: Banner[];
  scrollX: SharedValue<number>;
  windowWidth: number;
}

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const CARD_MARGIN = 20;
const AUTO_SCROLL_INTERVAL = 5000;

export function MarketingSlider({ banners }: MarketingSliderProps) {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const flatListRef = useRef<FlatList<Banner>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const isAutoScrolling = useRef(false);
  const isInteracting = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const cardWidth = windowWidth - (CARD_MARGIN * 2);
  const cardHeight = 120; // Thinner card as requested

  // Auto-scroll logic
  const startAutoScroll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (isInteracting.current || banners.length <= 1) return;

      let nextIndex = currentIndex + 1;
      if (nextIndex >= banners.length) {
        nextIndex = 0;
      }

      isAutoScrolling.current = true;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, AUTO_SCROLL_INTERVAL);
  }, [currentIndex, banners.length]);

  useEffect(() => {
    startAutoScroll();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startAutoScroll]);

  const setIsInteracting = (value: boolean) => {
    isInteracting.current = value;
    if (!value) {
      // Resume auto-scroll after interaction ends (with a delay if needed)
      startAutoScroll();
    } else {
        if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
    onBeginDrag: () => {
      runOnJS(setIsInteracting)(true);
    },
    onEndDrag: () => {
      runOnJS(setIsInteracting)(false);
    },
  });

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  });

  const handlePress = (banner: Banner) => {
    // Interaction removed as requested
  };

  if (!banners || banners.length === 0) return null;

  return (
    <View style={styles.container}>
      <AnimatedFlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item: any) => item.id.toString()}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        renderItem={({ item, index }: { item: unknown; index: number }) => (
          <BannerItem
            item={item as Banner}
            index={index}
            scrollX={scrollX}
            windowWidth={windowWidth}
            cardHeight={cardHeight}
            onPress={() => handlePress(item as Banner)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 20 }} // Space for shadow
      />

      <Pagination banners={banners} scrollX={scrollX} windowWidth={windowWidth} />
    </View>
  );
}

const BannerItem = ({ item, index, scrollX, windowWidth, cardHeight, onPress }: BannerItemProps) => {
  const inputRange = [(index - 1) * windowWidth, index * windowWidth, (index + 1) * windowWidth];

  const animatedImageStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [-windowWidth * 0.2, 0, windowWidth * 0.2], // Parallax effect
      Extrapolation.CLAMP
    );

    const scale = interpolate(
        scrollX.value,
        inputRange,
        [1.2, 1, 1.2], // Slight zoom out on focus
        Extrapolation.CLAMP
    );

    return {
      transform: [{ translateX }, { scale }],
    };
  });

  const animatedContentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [20, 0, 20], // Slide up effect
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
      const scale = interpolate(
          scrollX.value,
          inputRange,
          [0.9, 1, 0.9], // Card scale effect
          Extrapolation.CLAMP
      );
      return {
          transform: [{ scale }]
      };
  });

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onPress}
      style={{ width: windowWidth, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={[styles.card, { height: cardHeight, width: windowWidth - (CARD_MARGIN * 2) }, animatedContainerStyle]}>
        <View style={styles.imageContainer}>
            <Animated.View style={[StyleSheet.absoluteFill, animatedImageStyle]}>
                <Image
                    source={getOptimizedImageSource(item.image_url, windowWidth)}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    transition={200}
                />
            </Animated.View>
        </View>

        <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
            locations={[0, 0.5, 1]}
            style={styles.gradient}
        >
            <Animated.View style={[styles.textContainer, animatedContentStyle]}>
                {item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            </Animated.View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const Pagination = ({ banners, scrollX, windowWidth }: PaginationProps) => {
    return (
        <View style={styles.pagination}>
            {banners.map((_, index) => {
                const animatedDotStyle = useAnimatedStyle(() => {
                    const inputRange = [(index - 1) * windowWidth, index * windowWidth, (index + 1) * windowWidth];

                    const width = interpolate(
                        scrollX.value,
                        inputRange,
                        [8, 24, 8],
                        Extrapolation.CLAMP
                    );

                    const opacity = interpolate(
                        scrollX.value,
                        inputRange,
                        [0.5, 1, 0.5],
                        Extrapolation.CLAMP
                    );

                    return {
                        width,
                        opacity,
                    };
                });

                return (
                    <Animated.View
                        key={index}
                        style={[styles.dot, animatedDotStyle]}
                    />
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 20, // Increased border radius
    overflow: 'hidden',
    backgroundColor: '#1F2937', // Darker placeholder
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  imageContainer: {
      width: '100%',
      height: '100%',
      overflow: 'hidden', // Ensures image doesn't bleed out during scaling
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%', // Full height gradient for better text readability
    justifyContent: 'flex-end',
    padding: 24,
  },
  textContainer: {
      gap: 4,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    lineHeight: 22,
  },
  subtitle: {
    color: '#E5E7EB', // Gray 200
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.9,
    marginBottom: 4,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10, // Pull up closer
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#121212', // Primary Green
  },
});
