import { ModernBusinessCard } from '@/components/ModernBusinessCard';
import { ExploreHeader } from '@/components/ui/ExploreHeader';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, ListRenderItem, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RestaurantMap from '@/components/RestaurantMap';
import RestaurantMapCard from '@/components/RestaurantMapCard';

// Shared Types
interface Restaurant {
  id: number;
  name: string;
  image_url: string;
  rating: number;
  cuisine_type: string;
  address: string;
  latitude?: number;
  longitude?: number;
  category_id?: number;
  opening_time?: string;
  closing_time?: string;
}

interface Category {
  id: number;
  name: string;
  emoji: string;
  color?: string;
}

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2; // 2 columns with padding

export default function ExploreScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [isMapMode, setIsMapMode] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    await Promise.all([
      fetchRestaurants(),
      fetchCategories(),
      getUserLocation()
    ]);
    setLoading(false);
  };

  const fetchRestaurants = async () => {
    const { data } = await supabase.from('locales').select('*').order('id');
    if (data) {
      setRestaurants(data);
      setFilteredRestaurants(data);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('id');
    if (data) setCategories(data);
  };

  const getUserLocation = async () => {
    try {
      const cached = await AsyncStorage.getItem('user_location');
      if (cached) setUserLocation(JSON.parse(cached));

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    } catch (e) {
      console.log("Location error", e);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredRestaurants(restaurants);
    } else {
      const lowerText = text.toLowerCase();
      const filtered = restaurants.filter(r =>
        (r.name || '').toLowerCase().includes(lowerText) ||
        (r.cuisine_type || '').toLowerCase().includes(lowerText)
      );
      setFilteredRestaurants(filtered);
    }
  };

  const handleCategoryPress = (category: Category) => {
     Haptics.selectionAsync();
     setSearchQuery(category.name);
     handleSearch(category.name);
  };

  function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
      const R = 6371e3;
      const φ1 = lat1 * Math.PI/180;
      const φ2 = lat2 * Math.PI/180;
      const Δφ = (lat2-lat1) * Math.PI/180;
      const Δλ = (lon2-lon1) * Math.PI/180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
  }

  function formatDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
      const d = getDistanceInMeters(lat1, lon1, lat2, lon2);
      return d < 1000 ? `a ${Math.round(d)}m` : `a ${(d / 1000).toFixed(1)} km`;
  }

  // --- Render Components ---

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { backgroundColor: item.color || '#333' }]}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.8}
    >
      <Text style={styles.categoryEmoji}>{item.emoji}</Text>
      <Text style={styles.categoryName} numberOfLines={2}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderRestaurantItem: ListRenderItem<Restaurant> = ({ item, index }) => {
      const distance = (userLocation && item.latitude && item.longitude)
          ? formatDistance(userLocation.latitude, userLocation.longitude, item.latitude, item.longitude)
          : undefined;

      return (
          <View style={{ marginBottom: 16 }}>
             <ModernBusinessCard
                restaurant={item}
                isLast={index === filteredRestaurants.length - 1}
                distance={distance}
             />
          </View>
      );
  };

  const renderListHeader = () => {
    if (searchQuery.length > 0) {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Resultados para "{searchQuery}"</Text>
          <Text style={styles.resultCount}>{filteredRestaurants.length} encontrados</Text>
        </View>
      );
    }

    return (
      <View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explorar Categorías</Text>
        </View>
        <View style={styles.gridContainer}>
          {categories.map((cat, index) => (
             <Animated.View
                key={cat.id}
                entering={FadeInDown.delay(index * 50).springify()}
                style={styles.gridItemWrapper}
             >
               {renderCategoryItem({ item: cat })}
             </Animated.View>
          ))}
        </View>

        <View style={[styles.sectionHeader, { marginTop: 32 }]}>
          <Text style={styles.sectionTitle}>Descubre Restaurantes</Text>
        </View>
      </View>
    );
  };

  // HEADER OFFSET
  const HEADER_MAX_HEIGHT = insets.top + 80;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <ExploreHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        onToggleMap={() => setIsMapMode(!isMapMode)}
        isMapMode={isMapMode}
        scrollY={scrollY}
      />

      {/* Main Content */}
      {isMapMode ? (
         <View style={StyleSheet.absoluteFill}>
            <RestaurantMap
                restaurants={filteredRestaurants} // Show filtered logic on map too!
                selectedRestaurant={selectedRestaurant}
                onSelectRestaurant={setSelectedRestaurant}
                userLocation={userLocation}
                topOffset={HEADER_MAX_HEIGHT}
            />
            {/* Map Card Overlay */}
            {selectedRestaurant && (
                <RestaurantMapCard
                    restaurant={selectedRestaurant}
                    onPress={() => router.push(`/restaurant/${selectedRestaurant.id}`)}
                    onClose={() => setSelectedRestaurant(null)}
                />
            )}
         </View>
      ) : (
        <Animated.FlatList
          data={searchQuery.length > 0 ? filteredRestaurants : restaurants} // If no search, show all restaurants below categories
          renderItem={renderRestaurantItem}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderListHeader()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: HEADER_MAX_HEIGHT + 20,
            paddingBottom: 100
          }}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          keyboardDismissMode="on-drag"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  resultCount: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  // Grid Styles
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItemWrapper: {
    width: COLUMN_WIDTH,
    marginBottom: 12,
  },
  categoryCard: {
    borderRadius: 16,
    padding: 16,
    height: 100,
    justifyContent: 'space-between',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121212', // Dark text for better contrast on light pastel backgrounds
  },
});
