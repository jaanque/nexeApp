import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ModernHeaderProps {
  greeting: string;
  points: number;
  initials: string;
  isGuest?: boolean; // New prop
  onScanPress: () => void;
  onWalletPress: () => void;
  onProfilePress: () => void;
  onSearchPress: () => void;
}

export function ModernHeader({
    greeting,
    points,
    initials,
    isGuest = false,
    onScanPress,
    onWalletPress,
    onProfilePress,
    onSearchPress
}: ModernHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const HEADER_HEIGHT = 200;

  // Trigger animation when isGuest changes
  useEffect(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [isGuest]);

  const handleLoginPress = () => {
      Haptics.selectionAsync();
      router.push('/login');
  };

  const handleRegisterPress = () => {
      Haptics.selectionAsync();
      router.push('/register');
  };

  return (
    <View style={[styles.container, { height: HEADER_HEIGHT, backgroundColor: '#121212' }]}>
        <View style={styles.background}>
            <View style={[styles.content, { paddingTop: insets.top + 10 }]}>
                {/* Top Row: Avatar & Actions */}
                <View style={styles.topRow}>
                    <TouchableOpacity onPress={onProfilePress} style={styles.avatarButton}>
                        <View style={styles.avatar}>
                             {isGuest ? (
                                <Ionicons name="person-outline" size={20} color="#fff" />
                             ) : (
                                <Text style={styles.avatarText}>{initials}</Text>
                             )}
                        </View>
                    </TouchableOpacity>

                    <View style={styles.actionsRow}>
                        {!isGuest && (
                            <TouchableOpacity onPress={onWalletPress} style={styles.iconButton}>
                                <Ionicons name="wallet-outline" size={24} color="#fff" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={onSearchPress} style={styles.iconButton}>
                            <Ionicons name="search-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Content: Greeting & Points/Login */}
                <View style={styles.mainContent}>
                    <Text style={styles.greeting}>{greeting}</Text>

                    {isGuest ? (
                        <View style={styles.guestActions}>
                            <TouchableOpacity style={styles.primaryButton} onPress={handleLoginPress}>
                                <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
                            </TouchableOpacity>
                             <TouchableOpacity style={styles.secondaryButton} onPress={handleRegisterPress}>
                                <Text style={styles.secondaryButtonText}>Registrarse</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.pointsRow}>
                            <Text style={styles.pointsValue}>{points.toLocaleString()}</Text>
                            <Text style={styles.pointsLabel}> pts</Text>

                            <TouchableOpacity
                                style={styles.scanIconButton}
                                activeOpacity={0.8}
                                onPress={onScanPress}
                            >
                                <Ionicons name="qr-code-outline" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

        </View>
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
      overflow: 'hidden',
  },
  content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingBottom: 24,
      justifyContent: 'flex-start',
      gap: 16,
  },
  topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
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
      borderRadius: 16,
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
      marginBottom: 10,
      justifyContent: 'center', // Center vertically in the remaining space
      flex: 1,
  },
  greeting: {
      fontSize: 16,
      color: '#A1A1AA',
      marginBottom: 8,
      fontWeight: '500',
      letterSpacing: 0.5,
  },
  pointsRow: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  pointsValue: {
      fontSize: 36,
      fontWeight: '800',
      color: '#fff',
      letterSpacing: -1,
      lineHeight: 40,
  },
  pointsLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.8)',
      marginLeft: 4,
      marginTop: 6,
  },
  scanIconButton: {
      marginLeft: 12,
      backgroundColor: 'rgba(255,255,255,0.1)',
      width: 36,
      height: 36,
      borderRadius: 18,
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
  guestActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 4,
  },
  primaryButton: {
      backgroundColor: '#fff',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
  },
  primaryButtonText: {
      color: '#121212',
      fontWeight: '700',
      fontSize: 14,
  },
  secondaryButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
  },
  secondaryButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 14,
  }
});
