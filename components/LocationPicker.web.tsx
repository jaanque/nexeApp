import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
// import MapView from 'react-native-maps'; // Removed for web
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LocationPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelectLocation: (location: { latitude: number, longitude: number }, address: string, isManual: boolean) => void;
    initialLocation?: { latitude: number, longitude: number };
}

type Mode = 'options' | 'map' | 'text';

export default function LocationPicker({ visible, onClose, onSelectLocation, initialLocation }: LocationPickerProps) {
    const insets = useSafeAreaInsets();
    const [mode, setMode] = useState<Mode>('options');
    const [loading, setLoading] = useState(false);

    // Text Input State
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        if (visible) {
            setMode('options');
            setSearchText("");
        }
    }, [visible]);

    const handleUseCurrentLocation = async () => {
        setLoading(true);
        try {
            // Web geolocation
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        onSelectLocation({ latitude, longitude }, "Ubicación actual (Web)", false);
                        onClose();
                        setLoading(false);
                    },
                    (error) => {
                        console.error(error);
                        Alert.alert('Error', 'No pudimos obtener tu ubicación.');
                        setLoading(false);
                    }
                );
            } else {
                 Alert.alert('Error', 'Geolocation no soportado en este navegador.');
                 setLoading(false);
            }
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleTextSearch = async () => {
        if (!searchText.trim()) return;
        setLoading(true);
        // Mock geocoding for web test or use a simple fetch if needed.
        // For verification, we just pretend we found Madrid.
        setTimeout(() => {
             onSelectLocation({ latitude: 40.416775, longitude: -3.703790 }, searchText, true);
             onClose();
             setLoading(false);
        }, 1000);
    };

    const renderOptions = () => (
        <View style={styles.optionsContainer}>
            <View style={styles.handle} />
            <Text style={styles.title}>¿Dónde quieres recibir tu pedido?</Text>

            <TouchableOpacity style={styles.optionButton} onPress={handleUseCurrentLocation}>
                <View style={[styles.iconContainer, { backgroundColor: '#E0F2FE' }]}>
                    <Ionicons name="navigate" size={24} color="#0284C7" />
                </View>
                <Text style={styles.optionText}>Usar ubicación actual</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionButton} onPress={() => setMode('text')}>
                <View style={[styles.iconContainer, { backgroundColor: '#F3F4F6' }]}>
                    <Ionicons name="search" size={24} color="#374151" />
                </View>
                <Text style={styles.optionText}>Escribir dirección</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionButton} onPress={() => setMode('map')}>
                <View style={[styles.iconContainer, { backgroundColor: '#F3F4F6' }]}>
                    <Ionicons name="map" size={24} color="#374151" />
                </View>
                <Text style={styles.optionText}>Seleccionar en el mapa</Text>
            </TouchableOpacity>
        </View>
    );

    const renderMap = () => (
        <View style={styles.fullScreenContainer}>
             <Text style={{textAlign: 'center', marginTop: 100}}>Mapa no disponible en web.</Text>
             <TouchableOpacity style={styles.backButton} onPress={() => setMode('options')}>
                 <Text>Volver</Text>
             </TouchableOpacity>
        </View>
    );

    const renderText = () => (
        <View style={[styles.textContainer, { paddingTop: insets.top + 20 }]}>
                <View style={styles.textHeader}>
                <TouchableOpacity onPress={() => setMode('options')} style={{ padding: 10 }}>
                    <Ionicons name="close" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.textTitle}>Ingresa tu dirección</Text>
                </View>

                <TextInput
                style={styles.input}
                placeholder="Ej: Calle Gran Vía 1, Madrid"
                value={searchText}
                onChangeText={setSearchText}
                autoFocus
                onSubmitEditing={handleTextSearch}
                />

                <TouchableOpacity
                style={[styles.searchButton, !searchText && { opacity: 0.5 }]}
                onPress={handleTextSearch}
                disabled={!searchText || loading}
                >
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.searchButtonText}>Buscar</Text>}
                </TouchableOpacity>
        </View>
    );

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.modalOverlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

                {mode === 'options' && (
                    <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 20 }]}>
                        {loading ? <ActivityIndicator size="large" color="#000" style={{ margin: 20 }} /> : renderOptions()}
                    </View>
                )}

                {mode === 'map' && renderMap()}
                {mode === 'text' && renderText()}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    bottomSheet: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        minHeight: 300,
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 2.5,
        alignSelf: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    optionsContainer: {
        width: '100%',
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1F2937',
    },
    fullScreenContainer: {
        flex: 1,
        backgroundColor: 'white',
        width: '100%',
        height: '100%',
    },
    mapFooter: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        flexDirection: 'row',
        padding: 20,
        backgroundColor: 'white',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginRight: 10,
    },
    confirmButton: {
        flex: 1,
        backgroundColor: '#111827',
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    textContainer: {
        flex: 1,
        padding: 20,
        backgroundColor: 'white',
        height: '100%',
    },
    textHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    textTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        marginBottom: 20,
    },
    searchButton: {
        backgroundColor: '#111827',
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
