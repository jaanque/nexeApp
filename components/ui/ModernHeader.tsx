import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, StatusBar as RNStatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ModernHeaderProps {
  greeting: string;
  points: number;
  initials: string;
  onScanPress: () => void;
  onWalletPress: () => void;
  onProfilePress: () => void;
  onSearchPress: () => void;
}

export function ModernHeader({ greeting, points, initials, onScanPress, onWalletPress, onProfilePress, onSearchPress }: ModernHeaderProps) {
  const insets = useSafeAreaInsets();
  const HEADER_HEIGHT = 200; // Thinner banner as requested

  return (
    <View style={[styles.container, { height: HEADER_HEIGHT }]}>
        <LinearGradient
            colors={['#121212', '#2C2C2E']} // Dark, premium background
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.background}
        >
            <View style={[styles.content, { paddingTop: insets.top + 10 }]}>
                {/* Top Row: Avatar & Actions */}
                <View style={styles.topRow}>
                    <TouchableOpacity onPress={onProfilePress} style={styles.avatarButton}>
                        <View style={styles.avatar}>
                             <Ionicons name="person-outline" size={20} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.actionsRow}>
                        <TouchableOpacity onPress={onWalletPress} style={styles.iconButton}>
                            <Ionicons name="wallet-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onSearchPress} style={styles.iconButton}>
                            <Ionicons name="search-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Content: Greeting & Points */}
                <View style={styles.mainContent}>
                    <Text style={styles.greeting}>{greeting}</Text>
                    <View style={styles.pointsRow}>
                        <Text style={styles.pointsValue}>{points.toLocaleString()}</Text>
                        <Text style={styles.pointsLabel}> pts</Text>

                        <TouchableOpacity
                            style={styles.scanIconButton}
                            activeOpacity={0.8}
                            onPress={onScanPress}
                        >
                            <Ionicons name="qr-code-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Bottom Gradient Fade for merging with content */}
            <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.05)']}
                style={styles.bottomOverlay}
            />
        </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
      marginBottom: 0,
      zIndex: 10,
  },
  background: {
      flex: 1,
      // Removed rounded corners as requested
      overflow: 'hidden',
  },
  content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingBottom: 20,
      justifyContent: 'flex-start',
      gap: 16, // Tighter gap for smaller height
  },
  topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
  },
  avatarButton: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
  },
  avatar: {
      width: 44,
      height: 44,
      borderRadius: 16, // Squircle
      backgroundColor: 'rgba(255,255,255,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
  },
  actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  iconButton: {
      width: 44,
      height: 44,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
  },
  mainContent: {
      marginBottom: 20,
  },
  greeting: {
      fontSize: 16,
      color: '#A1A1AA', // Zinc 400
      marginBottom: 4,
      fontWeight: '500',
      letterSpacing: 0.5,
  },
  pointsRow: {
      flexDirection: 'row',
      alignItems: 'center', // Changed to center for icon alignment
  },
  pointsValue: {
      fontSize: 48,
      fontWeight: '800', // Heavy Bold
      color: '#fff',
      letterSpacing: -1.5,
      lineHeight: 52,
  },
  pointsLabel: {
      fontSize: 20,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.8)',
      marginLeft: 4,
      marginTop: 8, // Adjust visual baseline
  },
  scanIconButton: {
      marginLeft: 16,
      backgroundColor: 'rgba(255,255,255,0.1)',
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
  },
  bottomOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 60,
  },
});
