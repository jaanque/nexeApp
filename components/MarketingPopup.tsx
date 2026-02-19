import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

export interface Banner {
  id: number;
  image_url: string;
  title: string;
  subtitle?: string;
  description?: string;
  deep_link?: string;
}

interface MarketingPopupProps {
    visible: boolean;
    banner: Banner | null;
    onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export const MarketingPopup = ({ visible, banner, onClose }: MarketingPopupProps) => {
    if (!banner) return null;

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                {/* Blur Background */}
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

                <Animated.View
                    entering={SlideInDown.springify().damping(15)}
                    style={styles.popupContainer}
                >
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: banner.image_url }}
                            style={styles.image}
                            contentFit="cover"
                            transition={300}
                        />
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <BlurView intensity={50} tint="dark" style={styles.closeButtonBlur}>
                                <Ionicons name="close" size={24} color="#FFF" />
                            </BlurView>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <Animated.Text entering={FadeInDown.delay(100)} style={styles.subtitle}>
                            {banner.subtitle || 'NOVEDAD'}
                        </Animated.Text>
                        <Animated.Text entering={FadeInDown.delay(200)} style={styles.title}>
                            {banner.title}
                        </Animated.Text>

                        <Animated.View entering={FadeInDown.delay(300)} style={styles.divider} />

                        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                            <Animated.Text entering={FadeInDown.delay(400)} style={styles.description}>
                                {banner.description || 'Descubre esta oferta exclusiva por tiempo limitado. Aprovecha los descuentos y novedades que tenemos preparados para ti.'}
                            </Animated.Text>
                        </ScrollView>

                        {banner.deep_link && (
                            <Animated.View entering={FadeInDown.delay(500)} style={styles.footer}>
                                <TouchableOpacity style={styles.actionButton} onPress={() => {
                                    // Handle deep link navigation here if needed, or keep it inside the popup info
                                    // For now, maybe just close or navigate
                                    onClose();
                                }}>
                                    <Text style={styles.actionButtonText}>Entendido</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        )}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    popupContainer: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#1F2937',
        borderRadius: 24,
        overflow: 'hidden',
        maxHeight: height * 0.7,
        boxShadow: "0px 10px 30px rgba(0,0,0,0.5)",
    },
    imageContainer: {
        width: '100%',
        height: 200,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        borderRadius: 20,
        overflow: 'hidden',
    },
    closeButtonBlur: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
    },
    subtitle: {
        color: '#10B981', // Emerald 500
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#F9FAFB',
        letterSpacing: -0.5,
        lineHeight: 28,
    },
    divider: {
        height: 1,
        backgroundColor: '#374151',
        marginVertical: 16,
    },
    scrollContent: {
        maxHeight: 150,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: '#D1D5DB',
    },
    footer: {
        marginTop: 24,
    },
    actionButton: {
        backgroundColor: '#10B981',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
});
