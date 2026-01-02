import {NativeModules} from 'react-native';

interface DebugOverlayModuleType {
  showClickPoint(x: number, y: number, duration?: number): Promise<void>;
}

const {DebugOverlayModule} = NativeModules;

export default DebugOverlayModule as DebugOverlayModuleType;
