// Fallback for using Ionicons on Android and web.

import Ionicons from '@expo/vector-icons/Ionicons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof Ionicons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Ionicons mappings here.
 * - see Ionicons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'house': 'home', // Filled
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-forward',
  'chevron.down': 'chevron-down',
  'safari.fill': 'compass',
  'safari': 'compass', // Filled
  'qrcode.viewfinder': 'scan-circle', // Filled circle
  'creditcard.fill': 'card',
  'person.fill': 'person',
  'person': 'person', // Filled
  'bell.fill': 'notifications',
  'star.fill': 'star',
  'fast-food': 'fast-food',
  'pizza': 'pizza',
  'restaurant': 'restaurant',
  'ice-cream': 'ice-cream',
  'wine': 'wine',
  'bicycle': 'bicycle',
  'bag-handle-outline': 'bag-handle-outline',
  'flash-outline': 'flash-outline',
  'swap-horizontal-outline': 'swap-horizontal-outline',
  'gift-outline': 'gift-outline',
  'color-wand-outline': 'color-wand-outline',
  'map-outline': 'map-outline',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Ionicons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Ionicons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <Ionicons color={color} size={size} name={MAPPING[name]} style={style} />;
}
