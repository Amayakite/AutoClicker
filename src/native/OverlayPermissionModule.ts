import {NativeModules} from 'react-native';

interface OverlayPermissionModuleType {
  checkPermission(): Promise<boolean>;
  requestPermission(): Promise<void>;
}

const {OverlayPermissionModule} = NativeModules;

export default OverlayPermissionModule as OverlayPermissionModuleType;
