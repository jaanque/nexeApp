import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, FlatList, Animated, Easing, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

interface LocationPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelectLocation: (location: { latitude: number, longitude: number }, address: string, isManual: boolean) => void;
    initialLocation?: { latitude: number, longitude: number };
}

type Mode = 'options' | 'map' | 'text';

interface Suggestion {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
}

export default function LocationPicker({ visible, onClose, onSelectLocation, initialLocation }: LocationPickerProps) {
    const insets = useSafeAreaInsets();
    const [mode, setMode] = useState<Mode>('options');
    const [loading, setLoading] = useState(false);

    // Animation
    const slideAnim = useRef(new Animated.Value(height)).current;

    // Text Input State
    const [searchText, setSearchText] = useState("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (visible) {
            setMode('options');
            setSearchText("");
            setSuggestions([]);

            // Start Animation
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false, // Web might not support native driver for all props or layouts
                easing: Easing.out(Easing.cubic),
            }).start();
        } else {
            slideAnim.setValue(height);
        }
    }, [visible]);

    const handleClose = () => {
        Animated.timing(slideAnim, {
            toValue: height,
            duration: 200,
            useNativeDriver: false,
        }).start(() => {
            onClose();
        });
    };

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

    const handleTextChange = (text: string) => {
        setSearchText(text);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (!text.trim()) {
            setSuggestions([]);
            return;
        }

        searchTimeout.current = setTimeout(async () => {
            try {
                // Using OpenStreetMap Nominatim for free autocomplete suggestions
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&addressdetails=1&limit=5`, {
                    headers: {
                        'User-Agent': 'NexeApp/1.0'
                    }
                });
                const data = await response.json();
                setSuggestions(data);
            } catch (error) {
                console.error("Error fetching suggestions:", error);
            }
        }, 500); // 500ms debounce
    };

    const handleSuggestionSelect = (suggestion: Suggestion) => {
        const lat = parseFloat(suggestion.lat);
        const lon = parseFloat(suggestion.lon);
        onSelectLocation({ latitude: lat, longitude: lon }, suggestion.display_name, true);
        onClose();
    };

    const handleTextSearch = async () => {
        if (!searchText.trim()) return;
        setLoading(true);

        // Try to use suggestions first
        if (suggestions.length > 0) {
            handleSuggestionSelect(suggestions[0]);
            setLoading(false);
            return;
        }

        // Fetch if no suggestions
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&addressdetails=1&limit=1`, {
                headers: { 'User-Agent': 'NexeApp/1.0' }
            });
            const data = await response.json();
            if (data && data.length > 0) {
                const item = data[0];
                const lat = parseFloat(item.lat);
                const lon = parseFloat(item.lon);
                onSelectLocation({ latitude: lat, longitude: lon }, item.display_name, true);
                onClose();
            } else {
                 Alert.alert('No encontrado', 'No encontramos esa dirección.');
            }
        } catch (e) {
             Alert.alert('Error', 'Error buscando dirección.');
        } finally {
            setLoading(false);
        }
    };

    const renderOptions = () => (
        <Animated.View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 20, transform: [{ translateY: slideAnim }] }]}>
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
        </Animated.View>
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
                    onChangeText={handleTextChange}
                    autoFocus
                    onSubmitEditing={handleTextSearch}
                />

                <FlatList
                    data={suggestions}
                    keyExtractor={(item) => item.place_id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSuggestionSelect(item)}>
                            <Ionicons name="location-outline" size={20} color="#6B7280" style={{ marginRight: 10 }} />
                            <Text style={styles.suggestionText}>{item.display_name}</Text>
                        </TouchableOpacity>
                    )}
                    style={styles.suggestionsList}
                />

                {suggestions.length === 0 && searchText.length > 0 && (
                     <TouchableOpacity
                        style={[styles.searchButton, !searchText && { opacity: 0.5 }]}
                        onPress={handleTextSearch}
                        disabled={!searchText || loading}
                    >
                        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.searchButtonText}>Buscar</Text>}
                    </TouchableOpacity>
                )}
        </View>
    );

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
            <View style={styles.modalOverlay}>
                <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />

                {mode === 'options' && renderOptions()}
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
        width: '100%',
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
    suggestionsList: {
        flex: 1,
    },
    suggestionItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        flexDirection: 'row',
        alignItems: 'center',
    },
    suggestionText: {
        fontSize: 14,
        color: '#374151',
        flex: 1,
    },
    searchButton: {
        backgroundColor: '#111827',
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    searchButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
