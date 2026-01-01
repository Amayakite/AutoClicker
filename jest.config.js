module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-.*|@react-navigation|react-native-paper|react-native-vector-icons|react-native-safe-area-context|react-native-draggable-flatlist)/)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/setup.ts',
  ],
};
