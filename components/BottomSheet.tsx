import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Snap points relative to the screen height (from top)
// 0 is top of screen.
const SNAP_POINTS = {
  expanded: SCREEN_HEIGHT * 0.1, // 10% from top
  half: SCREEN_HEIGHT * 0.55,    // 55% from top
  collapsed: SCREEN_HEIGHT - 100,// Peeking at bottom
};

interface BottomSheetProps {
  children: React.ReactNode;
  header?: React.ReactNode;
}

export default function BottomSheet({ children, header }: BottomSheetProps) {
  const translateY = useSharedValue(SNAP_POINTS.half);
  const context = useSharedValue({ y: 0 });

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = event.translationY + context.value.y;
      // Clamp to top
      if (translateY.value < SNAP_POINTS.expanded) {
          translateY.value = SNAP_POINTS.expanded;
      }
    })
    .onEnd(() => {
      if (translateY.value < SNAP_POINTS.expanded + 150) {
        translateY.value = withSpring(SNAP_POINTS.expanded, { damping: 15 });
      } else if (translateY.value > SNAP_POINTS.half + 100) {
        translateY.value = withSpring(SNAP_POINTS.collapsed, { damping: 15 });
      } else {
        translateY.value = withSpring(SNAP_POINTS.half, { damping: 15 });
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
    zIndex: 100, // Ensure it's on top of map
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
