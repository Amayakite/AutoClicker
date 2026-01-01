// Mock react-native-worklets
module.exports = {
  init: jest.fn(),
  useWorklets: jest.fn(() => ({})),
  createWorklet: jest.fn((fn) => fn),
  runOnJS: jest.fn((fn) => fn),
  runOnWorklet: jest.fn((fn) => fn),
};
