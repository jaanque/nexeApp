import React, { useMemo } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  children: React.ReactNode;
  header?: React.ReactNode;
}

export default function BottomSheet({ children, header }: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  // Calculate snap points dynamically based on safe area
  // 0 is top of screen
  const SNAP_POINTS = useMemo(() => {
      const bottomInset = insets.bottom || 20;
      // Estimate tab bar height ~60 + inset
      const tabBarHeightEstimate = 60 + bottomInset;
      const peekHeight = 100; // Amount of sheet visible above tab bar

      return {
          expanded: SCREEN_HEIGHT * 0.12, // 12% from top (leave room for status bar/header)
          half: SCREEN_HEIGHT * 0.55,     // 55% from top
          collapsed: SCREEN_HEIGHT - tabBarHeightEstimate - peekHeight,
      };
  }, [insets.bottom]);

  const translateY = useSharedValue(SNAP_POINTS.half);
  const context = useSharedValue({ y: 0 });

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      let newValue = event.translationY + context.value.y;
      // Clamp to top
      if (newValue < SNAP_POINTS.expanded) {
          newValue = SNAP_POINTS.expanded;
      }
      translateY.value = newValue;
    })
    .onEnd(() => {
      // Logic for snapping
      // No bounce: use withTiming or overdamped spring
      const config = {
          duration: 300,
          easing: Easing.out(Easing.cubic),
      };

      if (translateY.value < SNAP_POINTS.expanded + 100) {
        translateY.value = withTiming(SNAP_POINTS.expanded, config);
      } else if (translateY.value > SNAP_POINTS.half + 100) {
        translateY.value = withTiming(SNAP_POINTS.collapsed, config);
      } else {
        translateY.value = withTiming(SNAP_POINTS.half, config);
      }
    });

  const rBottomSheetStyle = useAnimatedStyle(() => {
    return {
      top: translateY.value,
    };
  });

  return (
    <Animated.View style={[styles.bottomSheetContainer, rBottomSheetStyle]}>
        <GestureDetector gesture={gesture}>
            <View style={styles.handleContainer}>
                <View style={styles.line} />
                {header}
            </View>
        </GestureDetector>
        <View style={styles.contentContainer}>
            {children}
        </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bottomSheetContainer: {
    height: SCREEN_HEIGHT,
    width: '100%',
    backgroundColor: 'white',
    position: 'absolute',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 100,
  },
  handleContainer: {
    paddingBottom: 10,
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  line: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 2,
  },
  contentContainer: {
      flex: 1,
      backgroundColor: 'white',
  }
});
