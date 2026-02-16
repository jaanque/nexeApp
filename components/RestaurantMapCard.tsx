import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    Easing,
    SlideInDown,
    SlideOutDown
} from 'react-native-reanimated';

interface Restaurant {
  id: number;
  name: string;
  image_url: string;
  rating: number;
  cuisine_type: string;
  address: string;
}

interface RestaurantMapCardProps {
  restaurant: Restaurant;
  onPress: () => void;
  onClose: () => void;
}

export default function RestaurantMapCard({ restaurant, onPress, onClose }: RestaurantMapCardProps) {

  return (
    <Animated.View
        style={styles.container}
        entering={SlideInDown.duration(300).easing(Easing.out(Easing.cubic))}
        exiting={SlideOutDown.duration(200).easing(Easing.in(Easing.cubic))}
    >
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={onPress}
      >
        <Image
            source={{ uri: restaurant.image_url }}
            style={styles.image}
            contentFit="cover"
            transition={200}
        />
        <View style={styles.content}>
            <View style={styles.header}>
                <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
                <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#FFFFFF" style={{ marginRight: 2 }} />
                    <Text style={styles.ratingText}>{restaurant.rating}</Text>
                </View>
            </View>

            <Text style={styles.cuisine} numberOfLines={1}>{restaurant.cuisine_type} • {restaurant.address}</Text>

            <TouchableOpacity style={styles.button} onPress={onPress}>
                <Text style={styles.buttonText}>Ver detalles</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
        </View>

        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={(e) => { e.stopPropagation(); onClose(); }}>
            <Ionicons name="close" size={16} color="#000" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30, // Above tab bar
    left: 20,
    right: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    height: 120, // Compact height
  },
  image: {
    width: 96,
    height: 96,
    borderRadius: 16,
    backgroundColor: '#F5F6F8',
  },
  content: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  name: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#121212',
      flex: 1,
      marginRight: 8,
  },
  ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#121212',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
  },
  ratingText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 12,
  },
  cuisine: {
      fontSize: 14,
      color: '#6E7278',
      marginBottom: 8,
  },
  button: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  buttonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#121212',
      marginRight: 4,
  },
  closeButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#F0F0F0',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
  },
});
