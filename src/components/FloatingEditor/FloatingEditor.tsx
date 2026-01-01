import React, {useState, useCallback} from 'react';
import {View, StyleSheet, Modal, Dimensions} from 'react-native';
import {useClickStore} from '../../store/clickStore';
import {ClickPoint} from '../../types';
import EditorPanel from './EditorPanel';
import MarkerLayer from './MarkerLayer';

interface FloatingEditorProps {
  scriptId: string;
  visible: boolean;
  onClose: () => void;
}

/**
 * 悬浮窗点位编辑器主组件
 * 包含左侧操作面板和可拖动的点位标记
 */
const FloatingEditor: React.FC<FloatingEditorProps> = ({
  scriptId,
  visible,
  onClose,
}) => {
  const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
  const {
    scripts,
    addPointToScript,
    updatePointInScript,
    deletePointFromScript,
  } = useClickStore();

  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  const script = scripts.find(s => s.id === scriptId);

  // 添加新点位（在屏幕中央创建）
  const handleAddPoint = useCallback(() => {
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;
    addPointToScript(scriptId, centerX, centerY);
  }, [scriptId, screenWidth, screenHeight, addPointToScript]);

  // 删除点位
  const handleDeletePoint = useCallback(
    (pointId: string) => {
      deletePointFromScript(scriptId, pointId);
      if (selectedPointId === pointId) {
        setSelectedPointId(null);
      }
    },
    [scriptId, selectedPointId, deletePointFromScript],
  );

  // 更新点位
  const handleUpdatePoint = useCallback(
    (pointId: string, updates: Partial<ClickPoint>) => {
      updatePointInScript(scriptId, pointId, updates);
    },
    [scriptId, updatePointInScript],
  );

  // 更新点位位置（拖动时）
  const handleUpdatePointPosition = useCallback(
    (pointId: string, x: number, y: number) => {
      updatePointInScript(scriptId, pointId, {x, y});
    },
    [scriptId, updatePointInScript],
  );

  if (!script) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 半透明背景 */}
        <View style={styles.overlay} />

        {/* 可拖动的点位标记层 */}
        <MarkerLayer
          points={script.points}
          selectedPointId={selectedPointId}
          onSelectPoint={setSelectedPointId}
          onUpdatePointPosition={handleUpdatePointPosition}
        />

        {/* 操作面板 */}
        <EditorPanel
          scriptName={script.name}
          points={script.points}
          selectedPointId={selectedPointId}
          onSelectPoint={setSelectedPointId}
          onAddPoint={handleAddPoint}
          onDeletePoint={handleDeletePoint}
          onUpdatePoint={handleUpdatePoint}
          onClose={onClose}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});

export default FloatingEditor;
