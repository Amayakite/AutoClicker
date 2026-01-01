import React, {useState, useEffect, useCallback} from 'react';
import {View, StyleSheet, ScrollView, Alert, AppState, AppStateStatus} from 'react-native';
import {
  Appbar,
  Portal,
  Dialog,
  Button,
  Text,
  Switch,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import {useClickStore} from '../store/clickStore';
import ScriptList from '../components/ScriptList';
import {FloatingEditor} from '../components/FloatingEditor';
import AccessibilityModule from '../native/AccessibilityModule';
import {executionEngine} from '../services/executionEngine';

const ConfigScreen = () => {
  const {
    scripts,
    globalConfig,
    execution,
    updateGlobalConfig,
    startExecution,
    stopExecution,
    updateExecutionState,
    getScriptById,
  } = useClickStore();

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [serviceEnabled, setServiceEnabled] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null);

  // 检查无障碍服务状态
  const checkAccessibilityService = useCallback(async () => {
    try {
      setIsChecking(true);
      const enabled = await AccessibilityModule.isServiceEnabled();
      setServiceEnabled(enabled);
    } catch (error) {
      console.error('Failed to check accessibility service:', error);
      setServiceEnabled(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  // 应用启动时和从后台返回时检查服务状态
  useEffect(() => {
    checkAccessibilityService();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkAccessibilityService();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [checkAccessibilityService]);

  // 定期检查服务状态（每5秒）
  useEffect(() => {
    const interval = setInterval(() => {
      if (!execution.isRunning) {
        checkAccessibilityService();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [checkAccessibilityService, execution.isRunning]);

  const handleRequestPermission = async () => {
    try {
      await AccessibilityModule.requestPermission();
      Alert.alert(
        '权限设置',
        '请在设置中启用"自动点击器"的无障碍服务，启用后返回此应用',
        [{text: '确定'}],
      );
    } catch {
      Alert.alert('错误', '无法打开设置页面');
    }
  };

  // 运行脚本
  const handleRunScript = async (scriptId: string) => {
    const script = getScriptById(scriptId);
    if (!script) {
      Alert.alert('错误', '脚本不存在');
      return;
    }

    // 如果正在运行，停止
    if (execution.isRunning && execution.activeScriptId === scriptId) {
      executionEngine.stop();
      stopExecution();
      return;
    }

    if (!serviceEnabled) {
      Alert.alert('错误', '请先启用无障碍服务', [
        {text: '去设置', onPress: handleRequestPermission},
        {text: '取消'},
      ]);
      return;
    }

    if (script.points.length === 0) {
      Alert.alert('错误', '该脚本没有点击点，请先添加');
      return;
    }

    if (!script.enabled) {
      Alert.alert('错误', '该脚本已被禁用');
      return;
    }

    try {
      startExecution(scriptId);
      // 使用脚本自己的配置，但震动反馈使用全局配置
      const config = {
        ...script.config,
        vibrationEnabled: globalConfig.vibrationEnabled,
      };
      await executionEngine.execute(script.points, config, (index, iteration) => {
        updateExecutionState({currentIndex: index, loopIteration: iteration});
      });
      stopExecution();
      Alert.alert('完成', '执行完成');
    } catch (error: any) {
      stopExecution();
      Alert.alert('错误', error.message || '执行失败');
    }
  };

  // 编辑脚本点位
  const handleEditScript = (scriptId: string) => {
    setEditingScriptId(scriptId);
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="自动点击器" subtitle={`${scripts.length} 个脚本`} />
        <Appbar.Action icon="cog" onPress={() => setSettingsVisible(true)} />
      </Appbar.Header>

      {/* 无障碍服务状态提示 */}
      {!serviceEnabled && (
        <View style={styles.warningBanner}>
          {isChecking ? (
            <>
              <ActivityIndicator size="small" color="#000" />
              <Text style={styles.warningText}>检查无障碍服务状态...</Text>
            </>
          ) : (
            <>
              <Text style={styles.warningText}>⚠️ 无障碍服务未启用</Text>
              <Button mode="contained" onPress={handleRequestPermission}>
                去设置
              </Button>
            </>
          )}
        </View>
      )}

      {/* 脚本列表 */}
      <ScrollView style={styles.content}>
        <ScriptList
          onEditScript={handleEditScript}
          onRunScript={handleRunScript}
        />
      </ScrollView>

      {/* 悬浮窗编辑器 */}
      {editingScriptId && (
        <FloatingEditor
          scriptId={editingScriptId}
          visible={!!editingScriptId}
          onClose={() => setEditingScriptId(null)}
        />
      )}

      {/* 全局设置对话框 */}
      <Portal>
        <Dialog visible={settingsVisible} onDismiss={() => setSettingsVisible(false)}>
          <Dialog.Title>全局设置</Dialog.Title>
          <Dialog.Content>
            <View style={styles.settingRow}>
              <Text>震动反馈</Text>
              <Switch
                value={globalConfig.vibrationEnabled}
                onValueChange={value => updateGlobalConfig({vibrationEnabled: value})}
              />
            </View>
            <Divider style={styles.divider} />
            <Text style={styles.settingHint}>
              💡 提示：每个脚本可以单独设置启动延迟、循环等参数，在编辑点位时可以配置。
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSettingsVisible(false)}>关闭</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  warningBanner: {
    backgroundColor: '#ffeb3b',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  warningText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  settingHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  divider: {
    marginVertical: 8,
  },
});

export default ConfigScreen;
