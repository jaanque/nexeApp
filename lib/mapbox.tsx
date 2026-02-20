import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Camera, MapState } from '@rnmapbox/maps';

// Re-export types so consumers don't need to import from @rnmapbox/maps directly
export type { Camera, MapState };

let Mapbox: any;

try {
    // We use require to avoid static import that crashes if native module is missing
    const RNMapbox = require('@rnmapbox/maps');
    Mapbox = RNMapbox.default || RNMapbox;
} catch (error) {
    console.warn("Mapbox native module not found, using mock.");

    // Mock implementation to prevent crash
    const MockComponent = (props: any) => <View {...props} />;

    Mapbox = {
        setAccessToken: (_token: string) => {},
        StyleURL: { Street: 'mapbox://styles/mapbox/streets-v11' },
        MapView: (props: any) => (
            <View style={[props.style, { backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#666' }}>Mapbox not available</Text>
                {props.children}
            </View>
        ),
        Camera: React.forwardRef((props: any, ref: any) => {
             if (ref) {
                 ref.current = {
                     setCamera: () => {},
                     fitBounds: () => {},
                 }
             }
             return null;
        }),
        UserLocation: MockComponent,
        PointAnnotation: (props: any) => <View>{props.children}</View>,
        Callout: MockComponent,
    };
}

export default Mapbox;
