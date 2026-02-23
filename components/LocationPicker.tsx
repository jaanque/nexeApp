import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Easing, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Region } from 'react-native-maps';
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
    address?: {
        road?: string;
        pedestrian?: string;
        house_number?: string;
        postcode?: string;
        city?: string;
        town?: string;
        village?: string;
    };
}

export default function LocationPicker({ visible, onClose, onSelectLocation, initialLocation }: LocationPickerProps) {
    const insets = useSafeAreaInsets();
    const [mode, setMode] = useState<Mode>('options');
    const [loading, setLoading] = useState(false);

    // Animation
    const slideAnim = useRef(new Animated.Value(height)).current;

    // Map State
    const mapRef = useRef<MapView>(null);
    const [region, setRegion] = useState<Region>({
        latitude: 40.416775,
        longitude: -3.703790,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });

    // Initial Location Effect
    useEffect(() => {
        if (initialLocation) {
            const newRegion = {
                latitude: initialLocation.latitude,
                longitude: initialLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
            setRegion(newRegion);
            mapRef.current?.animateToRegion(newRegion, 1000);
        }
    }, [initialLocation]);


    // Text Input State
    const [searchText, setSearchText] = useState("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (visible) {
            setMode('options');
            setSearchText("");
            setSuggestions([]);

            // Start Animation
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }).start();
        } else {
            slideAnim.setValue(height);
        }
    }, [visible, slideAnim]);

    const handleClose = () => {
        Animated.timing(slideAnim, {
            toValue: height,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            onClose();
        });
    };

    const handlePickup = async () => {
        setLoading(true);
        try {
            // Check for permission but don't force it for this mode if not needed by business logic,
            // however, we want to show stores "near me" so we do need location.
            // If user denies, we might want to default to a central location or let them browse all.
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                 // Even if denied, we can proceed with "Recogida en tienda" as a mode,
                 // but maybe we can't sort by distance.
                 // For now, let's just proceed with a default location or null location
                 // and let the Home screen handle it (it defaults to showing everything).
                 onSelectLocation({ latitude: 40.416775, longitude: -3.703790 }, "Recogida en tienda", true);
                 onClose();
                 setLoading(false);
                 return;
            }

            let location = await Location.getCurrentPositionAsync({});
            onSelectLocation(location.coords, "Recogida en tienda", true);
            onClose();
        } catch (error) {
            console.error(error);
            // Fallback
             onSelectLocation({ latitude: 40.416775, longitude: -3.703790 }, "Recogida en tienda", true);
             onClose();
        } finally {
            setLoading(false);
        }
    };

    // Disabled handlers
    const handleDisabledOption = () => {
        Alert.alert("Próximamente", "Esta funcionalidad estará disponible en futuras actualizaciones.");
    };

    const handleUseCurrentLocation = async () => {
        handleDisabledOption();
    };

    const handleMapConfirm = async () => {
        // ... (Disabled)
    };

    const handleTextChange = (text: string) => {
       // ...
    };

    const getFormattedAddress = (item: Suggestion) => {
        if (!item.address) return item.display_name;
        const street = item.address.road || item.address.pedestrian || "";
        const number = item.address.house_number ? ` ${item.address.house_number}` : "";
        const zip = item.address.postcode ? `, ${item.address.postcode}` : "";

        if (street) {
             return `${street}${number}${zip}`.trim();
        }
        return item.display_name.split(',').slice(0, 2).join(',').trim();
    };

    const handleSuggestionSelect = (suggestion: Suggestion) => {
        // ...
    };

    const handleTextSearch = async () => {
        // ...
    };

    const onRegionChangeComplete = (newRegion: Region) => {
        setRegion(newRegion);
    };

    const handleRecenterMap = async () => {
        // ...
    };

    const renderOptions = () => (
        <Animated.View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 20, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.handle} />
            <Text style={styles.title}>Selecciona una opción de entrega</Text>

            <TouchableOpacity style={styles.optionButton} onPress={handlePickup}>
                <View style={[styles.iconContainer, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="storefront-outline" size={24} color="#166534" />
                </View>
                <View>
                    <Text style={styles.optionText}>Recogida en tienda</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.optionButton, styles.disabledOption]} onPress={handleUseCurrentLocation}>
                <View style={[styles.iconContainer, { backgroundColor: '#F3F4F6' }]}>
                    <Ionicons name="navigate" size={24} color="#9CA3AF" />
                </View>
                <View>
                    <Text style={[styles.optionText, styles.disabledText]}>Usar ubicación actual</Text>
                    <Text style={styles.comingSoonText}>Próximamente</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.optionButton, styles.disabledOption]} onPress={handleDisabledOption}>
                <View style={[styles.iconContainer, { backgroundColor: '#F3F4F6' }]}>
                    <Ionicons name="search" size={24} color="#9CA3AF" />
                </View>
                <View>
                    <Text style={[styles.optionText, styles.disabledText]}>Escribir dirección</Text>
                    <Text style={styles.comingSoonText}>Próximamente</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.optionButton, styles.disabledOption]} onPress={handleDisabledOption}>
                <View style={[styles.iconContainer, { backgroundColor: '#F3F4F6' }]}>
                    <Ionicons name="map" size={24} color="#9CA3AF" />
                </View>
                 <View>
                    <Text style={[styles.optionText, styles.disabledText]}>Seleccionar en el mapa</Text>
                    <Text style={styles.comingSoonText}>Próximamente</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    // Keep renderMap and renderText for potential future re-enabling, or remove if desired.
    // For now, they are unreachable as mode is never set to 'map' or 'text'.
    const renderMap = () => (
        <View style={styles.fullScreenContainer}>
             <MapView
                ref={mapRef}
                style={styles.map}
                onRegionChangeComplete={onRegionChangeComplete}
                showsUserLocation={true}
                showsMyLocationButton={false}
                showsCompass={false}
                showsScale={false}
                initialRegion={region}
             />
             {/* ... */}
        </View>
    );

    const renderText = () => (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.fullScreenContainer}
        >
            {/* ... */}
        </KeyboardAvoidingView>
    );

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
            <View style={styles.modalOverlay}>
                <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />

                {mode === 'options' && renderOptions()}
                {/* modes 'map' and 'text' are currently unreachable */}
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
    disabledOption: {
        opacity: 0.6,
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
    disabledText: {
        color: '#9CA3AF',
    },
    comingSoonText: {
        fontSize: 12,
        color: '#EF4444', // Red color for "Próximamente" or maybe Orange/Gray
        marginTop: 2,
        fontWeight: '600'
    },
    fullScreenContainer: {
        flex: 1,
        backgroundColor: 'white',
        width: '100%',
        height: '100%',
    },
    map: {
        flex: 1,
    },
    centerMarker: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -40,
        marginLeft: -20,
        zIndex: 10,
    },
    recenterButton: {
        position: 'absolute',
        right: 20,
        bottom: 120,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
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
