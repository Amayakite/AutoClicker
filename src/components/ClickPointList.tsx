import React, {useState, useCallback} from 'react';
import {View, StyleSheet, Alert} from 'react-native';
import {List, IconButton, Text, FAB, Portal, Dialog, Button, TextInput, Switch, Divider} from 'react-native-paper';
import DraggableFlatList, {RenderItemParams} from 'react-native-draggable-flatlist';
import {useClickStore} from '../store/clickStore';
import {ClickPoint} from '../types';
import {APP_CONFIG} from '../constants/config';

// 提取左侧组件
interface LeftComponentProps {
  drag: () => void;
  isActive: boolean;
  enabled: boolean;
  onToggle: () => void;
}

const LeftComponent = ({drag, isActive, enabled, onToggle}: LeftComponentProps) => (
  <View style={styles.leftContainer}>
    <IconButton
      icon="drag"
      onLongPress={drag}
      disabled={isActive}
    />
    <Switch
      value={enabled}
      onValueChange={onToggle}
    />
  </View>
);

// 提取右侧组件
interface RightComponentProps {
  onEdit: () => void;
  onDelete: () => void;
}

const RightComponent = ({onEdit, onDelete}: RightComponentProps) => (
  <View style={styles.rightContainer}>
    <IconButton
      icon="pencil"
      onPress={onEdit}
    />
    <IconButton
      icon="delete"
      onPress={onDelete}
    />
  </View>
);

// 独立的列表项组件
interface ClickPointItemProps {
  item: ClickPoint;
  drag: () => void;
  isActive: boolean;
  onToggle: (id: string) => void;
  onEdit: (point: ClickPoint) => void;
  onDelete: (id: string) => void;
}

const ClickPointItem = React.memo(({item, drag, isActive, onToggle, onEdit, onDelete}: ClickPointItemProps) => {
  const leftContent = React.useMemo(() => (
    <LeftComponent
      drag={drag}
      isActive={isActive}
      enabled={item.enabled}
      onToggle={() => onToggle(item.id)}
    />
  ), [drag, isActive, item.enabled, item.id, onToggle]);

  const rightContent = React.useMemo(() => (
    <RightComponent
      onEdit={() => onEdit(item)}
      onDelete={() => onDelete(item.id)}
    />
  ), [item, onEdit, onDelete]);

  return (
    <List.Item
      title={item.name || `点 ${item.order + 1}`}
      description={`位置: (${item.x}, ${item.y}) | 延迟: ${item.delay}ms`}
      left={() => leftContent}
      right={() => rightContent}
      style={[styles.listItem, isActive && styles.activeItem]}
    />
  );
});

interface ClickPointListProps {
  scriptId: string;
}

/**
 * 点击点列表组件 - 用于显示和管理单个脚本中的点击点
 * @deprecated 请使用 FloatingEditor 组件代替
 */
const ClickPointList: React.FC<ClickPointListProps> = ({scriptId}) => {
  const {
    scripts,
    addPointToScript,
    updatePointInScript,
    deletePointFromScript,
    reorderPointsInScript,
    togglePointInScript,
  } = useClickStore();

  const script = scripts.find(s => s.id === scriptId);
  const points = script?.points || [];

  const [editingPoint, setEditingPoint] = useState<ClickPoint | null>(null);

  const handleAddPoint = () => {
    const x = Math.floor(Math.random() * 1000);
    const y = Math.floor(Math.random() * 2000);
    addPointToScript(scriptId, x, y);
  };

  const handleDeletePoint = useCallback((id: string) => {
    Alert.alert('确认删除', '确定要删除这个点击点吗？', [
      {text: '取消'},
      {text: '删除', onPress: () => deletePointFromScript(scriptId, id), style: 'destructive'},
    ]);
  }, [scriptId, deletePointFromScript]);

  const handleSaveEdit = () => {
    if (editingPoint) {
      updatePointInScript(scriptId, editingPoint.id, editingPoint);
      setEditingPoint(null);
    }
  };

  const handleTogglePoint = useCallback((id: string) => {
    togglePointInScript(scriptId, id);
  }, [scriptId, togglePointInScript]);

  const renderItem = useCallback(({item, drag, isActive}: RenderItemParams<ClickPoint>) => {
    return (
      <ClickPointItem
        item={item}
        drag={drag}
        isActive={isActive}
        onToggle={handleTogglePoint}
        onEdit={setEditingPoint}
        onDelete={handleDeletePoint}
      />
    );
  }, [handleTogglePoint, handleDeletePoint]);

  return (
    <View style={styles.container}>
      {points.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无点击点</Text>
          <Text style={styles.emptySubtext}>点击下方按钮添加点击点</Text>
        </View>
      ) : (
        <DraggableFlatList
          data={points}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          onDragEnd={({data}) => reorderPointsInScript(scriptId, data)}
        />
      )}

      <FAB
        icon="plus"
        label="添加点击点"
        style={styles.addFab}
        onPress={handleAddPoint}
        disabled={points.length >= APP_CONFIG.MAX_POINTS}
      />

      <Portal>
        <Dialog visible={editingPoint !== null} onDismiss={() => setEditingPoint(null)}>
          <Dialog.Title>编辑点击点</Dialog.Title>
          <Dialog.ScrollArea>
            <View style={styles.dialogContent}>
              <TextInput
                label="名称"
                value={editingPoint?.name || ''}
                onChangeText={text => setEditingPoint(prev => prev ? {...prev, name: text} : null)}
                mode="outlined"
                style={styles.input}
              />

              <View style={styles.row}>
                <TextInput
                  label="X 坐标"
                  value={editingPoint?.x.toString() || ''}
                  onChangeText={text => setEditingPoint(prev => prev ? {...prev, x: parseInt(text, 10) || 0} : null)}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.halfInput}
                />
                <TextInput
                  label="Y 坐标"
                  value={editingPoint?.y.toString() || ''}
                  onChangeText={text => setEditingPoint(prev => prev ? {...prev, y: parseInt(text, 10) || 0} : null)}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.halfInput}
                />
              </View>

              <TextInput
                label="延迟 (毫秒)"
                value={editingPoint?.delay.toString() || ''}
                onChangeText={text => setEditingPoint(prev => prev ? {...prev, delay: parseInt(text, 10) || 0} : null)}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />

              <Divider style={styles.divider} />

              <View style={styles.switchRow}>
                <Text>启用抖动</Text>
                <Switch
                  value={editingPoint?.jitter || false}
                  onValueChange={value => setEditingPoint(prev => prev ? {...prev, jitter: value} : null)}
                />
              </View>

              {editingPoint?.jitter && (
                <TextInput
                  label="抖动范围 (像素)"
                  value={editingPoint?.jitterRange.toString() || ''}
                  onChangeText={text => setEditingPoint(prev => prev ? {...prev, jitterRange: parseInt(text, 10) || 0} : null)}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                />
              )}

              <View style={styles.switchRow}>
                <Text>启用漂移</Text>
                <Switch
                  value={editingPoint?.drift || false}
                  onValueChange={value => setEditingPoint(prev => prev ? {...prev, drift: value} : null)}
                />
              </View>

              {editingPoint?.drift && (
                <TextInput
                  label="漂移速度"
                  value={editingPoint?.driftSpeed.toString() || ''}
                  onChangeText={text => setEditingPoint(prev => prev ? {...prev, driftSpeed: parseInt(text, 10) || 0} : null)}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                />
              )}
            </View>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setEditingPoint(null)}>取消</Button>
            <Button onPress={handleSaveEdit}>保存</Button>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  listItem: {
    backgroundColor: 'white',
  },
  activeItem: {
    backgroundColor: '#e3f2fd',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addFab: {
    position: 'absolute',
    margin: 16,
    left: 0,
    bottom: 0,
  },
  dialogContent: {
    padding: 16,
  },
  input: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  divider: {
    marginVertical: 12,
  },
});

export default ClickPointList;
