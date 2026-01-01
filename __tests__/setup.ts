/**
 * Jest setup file for mocking React Native modules
 */

// Mock react-native-worklets first
jest.mock('react-native-worklets', () => ({
  __esModule: true,
  default: {},
}));

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    GestureHandlerRootView: View,
    Swipeable: View,
    PanGestureHandler: View,
    TapGestureHandler: View,
    State: {},
    Directions: {},
  };
});

// Mock react-native-reanimated with comprehensive mocks
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    default: {
      View,
      Text: require('react-native').Text,
      Image: require('react-native').Image,
      ScrollView: require('react-native').ScrollView,
    },
    createAnimatedComponent: (component: any) => component,
    useSharedValue: () => ({value: 0}),
    useAnimatedStyle: () => ({}),
    useAnimatedGestureHandler: () => ({}),
    useAnimatedScrollHandler: () => ({}),
    useAnimatedRef: () => ({current: null}),
    useDerivedValue: (fn: any) => ({value: fn()}),
    withSpring: (value: any) => value,
    withTiming: (value: any) => value,
    withDecay: (value: any) => value,
    runOnUI: (fn: any) => fn,
    runOnJS: (fn: any) => fn,
    Easing: {
      linear: (x: number) => x,
      ease: (x: number) => x,
      quad: (x: number) => x,
      cubic: (x: number) => x,
    },
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock AccessibilityModule
jest.mock('../src/native/AccessibilityModule', () => ({
  __esModule: true,
  default: {
    checkPermission: jest.fn(() => Promise.resolve(false)),
    requestPermission: jest.fn(() => Promise.resolve()),
    simulateClick: jest.fn(() => Promise.resolve()),
    isServiceEnabled: jest.fn(() => Promise.resolve(false)),
  },
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
