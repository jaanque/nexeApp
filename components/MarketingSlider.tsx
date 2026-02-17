import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const isUserInteracting = useRef(false);
  const CARD_MARGIN = 20;
  const cardHeight = (windowWidth - CARD_MARGIN * 2) * (9 / 16);

  // Auto-scroll logic
  useEffect(() => {
    if (!banners || banners.length <= 1) return;

    const interval = setInterval(() => {
      if (isUserInteracting.current) return;

      let nextIndex = currentIndex + 1;
      if (nextIndex >= banners.length) {
        nextIndex = 0;
      }
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, banners.length]);

  const handleScrollBeginDrag = () => {
      isUserInteracting.current = true;
  };

  const handleScrollEndDrag = () => {
      setTimeout(() => {
          isUserInteracting.current = false;
      }, 3000);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / windowWidth);

    if (index !== currentIndex && index >= 0 && index < banners.length) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCurrentIndex(index);

      if (isUserInteracting.current) {
          Haptics.selectionAsync();
      }
    }
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
            <View style={[styles.card, { height: cardHeight }]}>
                <Image
                    source={{ uri: item.image_url }}
                    style={styles.image}
                    contentFit="cover"
                    transition={500}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']}
                    locations={[0, 0.5, 1]}
                    style={styles.gradient}
                >
                    <View style={styles.textContainer}>
                        <Text style={styles.subtitle}>{item.subtitle}</Text>
                        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                    </View>
                </LinearGradient>
            </View>
          </TouchableOpacity>
        )}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.list}
      />

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
    marginBottom: 32,
  },
  list: {
      flexGrow: 0,
  },
  card: {
    width: '100%',
    height: 120, // Even thinner
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB', // Placeholder gray
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
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
    height: '60%', // Reduced gradient height to show more image
    justifyContent: 'flex-end',
    padding: 24, // More padding
  },
  textContainer: {
      gap: 4,
  },
  title: {
    color: 'white',
    fontSize: 18, // Further adjusted
    fontWeight: '700',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    lineHeight: 32,
  },
  subtitle: {
    color: '#F3F4F6', // Lighter gray
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.95,
    marginBottom: 2,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#111827', // Gray 900
  },
  inactiveDot: {
    width: 6,
    backgroundColor: '#D1D5DB', // Gray 300
  },
});
