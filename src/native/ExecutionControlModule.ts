import {NativeModules} from 'react-native';

interface ExecutionControlModuleType {
  show(scriptId?: string): Promise<void>;
  hide(): Promise<void>;
  updateStatus(status?: string, progress?: string): Promise<void>;
}

const {ExecutionControlModule} = NativeModules;

export default ExecutionControlModule as ExecutionControlModuleType;
