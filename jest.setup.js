// Mock AccessibilityModule
jest.mock('./src/native/AccessibilityModule', () => ({
  default: {
    checkPermission: jest.fn().mockResolvedValue(false),
    requestPermission: jest.fn().mockResolvedValue(undefined),
    simulateClick: jest.fn().mockResolvedValue(undefined),
    isServiceEnabled: jest.fn().mockResolvedValue(false),
    isServiceRunning: jest.fn().mockResolvedValue(false),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
  AccessibilityEvents: null,
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Silence specific warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes('Animated: `useNativeDriver`')) return;
  originalWarn(...args);
};
