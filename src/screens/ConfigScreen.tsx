import React, {useState, useEffect, useCallback} from 'react';
import {View, StyleSheet, ScrollView, Alert, AppState, AppStateStatus} from 'react-native';
import {
  Appbar,
  FAB,
  Portal,
  Dialog,
  Button,
  Text,
  Switch,
  TextInput,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import {useClickStore} from '../store/clickStore';
import ClickPointList from '../components/ClickPointList';
import AccessibilityModule from '../native/AccessibilityModule';
import {executionEngine} from '../services/executionEngine';

const ConfigScreen = () => {
  const {points, config, execution, updateConfig, startExecution, stopExecution, updateExecutionState} = useClickStore();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [serviceEnabled, setServiceEnabled] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

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
        // 应用回到前台时重新检查状态
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

  const handleStartExecution = async () => {
    if (!serviceEnabled) {
      Alert.alert('错误', '请先启用无障碍服务', [
        {text: '去设置', onPress: handleRequestPermission},
        {text: '取消'},
      ]);
      return;
    }

    if (points.length === 0) {
      Alert.alert('错误', '请先添加点击点');
      return;
    }

    try {
      startExecution();
      await executionEngine.execute(points, config, (index, iteration) => {
        updateExecutionState({currentIndex: index, loopIteration: iteration});
      });
      stopExecution();
      Alert.alert('完成', '执行完成');
    } catch (error: any) {
      stopExecution();
      Alert.alert('错误', error.message || '执行失败');
    }
  };

  const handleStopExecution = () => {
    executionEngine.stop();
    stopExecution();
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="自动点击器" />
        <Appbar.Action icon="cog" onPress={() => setSettingsVisible(true)} />
      </Appbar.Header>

      {!serviceEnabled && (
        <View style={styles.warningBanner}>
          {isChecking ? (
            <>
              <ActivityIndicator size="small" color="#000" />
              <Text style={styles.warningText}>检查无障碍服务状态...</Text>
            </>
          ) : (
            <>
              <Text style={styles.warningText}>无障碍服务未启用</Text>
              <Button mode="contained" onPress={handleRequestPermission}>
                去设置
              </Button>
            </>
          )}
        </View>
      )}

      <ScrollView style={styles.content}>
        <ClickPointList />
      </ScrollView>

      <FAB
        icon={execution.isRunning ? 'stop' : 'play'}
        label={execution.isRunning ? '停止' : '运行'}
        style={styles.fab}
        onPress={execution.isRunning ? handleStopExecution : handleStartExecution}
      />

      <Portal>
        <Dialog visible={settingsVisible} onDismiss={() => setSettingsVisible(false)}>
          <Dialog.Title>全局设置</Dialog.Title>
          <Dialog.Content>
            <View style={styles.settingRow}>
              <Text>启动延迟 (毫秒)</Text>
              <TextInput
                mode="outlined"
                keyboardType="numeric"
                value={config.startDelay.toString()}
                onChangeText={text => updateConfig({startDelay: parseInt(text, 10) || 0})}
                style={styles.input}
              />
            </View>

            <Divider style={styles.divider} />

            <View style={styles.settingRow}>
              <Text>循环执行</Text>
              <Switch
                value={config.loopEnabled}
                onValueChange={value => updateConfig({loopEnabled: value})}
              />
            </View>

            {config.loopEnabled && (
              <View style={styles.settingRow}>
                <Text>循环次数 (0=无限)</Text>
                <TextInput
                  mode="outlined"
                  keyboardType="numeric"
                  value={config.loopCount.toString()}
                  onChangeText={text => updateConfig({loopCount: parseInt(text, 10) || 0})}
                  style={styles.input}
                />
              </View>
            )}

            <Divider style={styles.divider} />

            <View style={styles.settingRow}>
              <Text>震动反馈</Text>
              <Switch
                value={config.vibrationEnabled}
                onValueChange={value => updateConfig({vibrationEnabled: value})}
              />
            </View>
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  input: {
    width: 120,
  },
  divider: {
    marginVertical: 8,
  },
});

export default ConfigScreen;
