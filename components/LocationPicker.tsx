import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, TextInput, Dimensions, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

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

    // Map State
    const mapRef = useRef<MapView>(null);
    const [region, setRegion] = useState<Region>({
        latitude: initialLocation?.latitude || 40.416775, // Madrid default
        longitude: initialLocation?.longitude || -3.703790,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });
    const [selectedAddress, setSelectedAddress] = useState<string>("");

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
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación.');
                setLoading(false);
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            // Reverse geocode
            let address = "Ubicación actual";
            try {
                const reverseGeocode = await Location.reverseGeocodeAsync({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                });
                if (reverseGeocode.length > 0) {
                     const addr = reverseGeocode[0];
                     address = `${addr.street || addr.name || ""} ${addr.streetNumber || ""}`.trim() || "Ubicación actual";
                }
            } catch (e) { console.log(e); }

            onSelectLocation(location.coords, address, false); // isManual = false
            onClose();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No pudimos obtener tu ubicación actual.');
        } finally {
            setLoading(false);
        }
    };

    const handleMapConfirm = async () => {
        setLoading(true);
        try {
             // Reverse geocode center
             let address = "Ubicación seleccionada";
             try {
                const reverseGeocode = await Location.reverseGeocodeAsync({
                    latitude: region.latitude,
                    longitude: region.longitude
                });
                if (reverseGeocode.length > 0) {
                     const addr = reverseGeocode[0];
                     address = `${addr.street || addr.name || ""} ${addr.streetNumber || ""}`.trim() || "Ubicación seleccionada";
                }
             } catch (e) { console.log(e); }

             onSelectLocation({ latitude: region.latitude, longitude: region.longitude }, address, true);
             onClose();
        } catch (error) {
             Alert.alert('Error', 'No pudimos confirmar la ubicación.');
        } finally {
            setLoading(false);
        }
    };

    const handleTextSearch = async () => {
        if (!searchText.trim()) return;
        setLoading(true);
        try {
            const result = await Location.geocodeAsync(searchText);
            if (result.length > 0) {
                const { latitude, longitude } = result[0];
                 onSelectLocation({ latitude, longitude }, searchText, true);
                 onClose();
            } else {
                Alert.alert('No encontrado', 'No encontramos esa dirección.');
            }
        } catch (error) {
            Alert.alert('Error', 'Ocurrió un error al buscar la dirección.');
        } finally {
            setLoading(false);
        }
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
             <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={region}
                onRegionChangeComplete={setRegion}
                showsUserLocation
                showsMyLocationButton={false}
             />
             <View style={styles.centerMarker}>
                <Ionicons name="location" size={40} color="#EF4444" />
             </View>

             <View style={[styles.mapFooter, { paddingBottom: insets.bottom + 20 }]}>
                 <TouchableOpacity style={styles.backButton} onPress={() => setMode('options')}>
                     <Ionicons name="arrow-back" size={24} color="black" />
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.confirmButton} onPress={handleMapConfirm}>
                     <Text style={styles.confirmButtonText}>Confirmar ubicación</Text>
                 </TouchableOpacity>
             </View>
        </View>
    );

    const renderText = () => (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.fullScreenContainer}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
                        returnKeyType="search"
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
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent>
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
