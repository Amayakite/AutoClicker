import React, {useState} from 'react';
import {View, StyleSheet, Alert} from 'react-native';
import {List, IconButton, Text, FAB, Portal, Dialog, Button, TextInput, Switch, Divider} from 'react-native-paper';
import DraggableFlatList, {RenderItemParams} from 'react-native-draggable-flatlist';
import {useClickStore} from '../store/clickStore';
import {ClickPoint} from '../types';
import {APP_CONFIG} from '../constants/config';

const ClickPointList = () => {
  const {points, addPoint, updatePoint, deletePoint, reorderPoints, togglePoint} = useClickStore();
  const [editingPoint, setEditingPoint] = useState<ClickPoint | null>(null);
  const [isAddingPoint, setIsAddingPoint] = useState(false);

  const handleAddPoint = () => {
    const x = Math.floor(Math.random() * 1000);
    const y = Math.floor(Math.random() * 2000);
    addPoint(x, y);
  };

  const handleDeletePoint = (id: string) => {
    Alert.alert('确认删除', '确定要删除这个点击点吗？', [
      {text: '取消'},
      {text: '删除', onPress: () => deletePoint(id), style: 'destructive'},
    ]);
  };

  const handleSaveEdit = () => {
    if (editingPoint) {
      updatePoint(editingPoint.id, editingPoint);
      setEditingPoint(null);
    }
  };

  const renderItem = ({item, drag, isActive}: RenderItemParams<ClickPoint>) => (
    <List.Item
      title={item.name || `点 ${item.order + 1}`}
      description={`位置: (${item.x}, ${item.y}) | 延迟: ${item.delay}ms`}
      left={props => (
        <View style={styles.leftContainer}>
          <IconButton
            {...props}
            icon="drag"
            onLongPress={drag}
            disabled={isActive}
          />
          <Switch
            value={item.enabled}
            onValueChange={() => togglePoint(item.id)}
          />
        </View>
      )}
      right={props => (
        <View style={styles.rightContainer}>
          <IconButton
            {...props}
            icon="pencil"
            onPress={() => setEditingPoint(item)}
          />
          <IconButton
            {...props}
            icon="delete"
            onPress={() => handleDeletePoint(item.id)}
          />
        </View>
      )}
      style={[styles.listItem, isActive && styles.activeItem]}
    />
  );

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
          onDragEnd={({data}) => reorderPoints(data)}
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
                  onChangeText={text => setEditingPoint(prev => prev ? {...prev, x: parseInt(text) || 0} : null)}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.halfInput}
                />
                <TextInput
                  label="Y 坐标"
                  value={editingPoint?.y.toString() || ''}
                  onChangeText={text => setEditingPoint(prev => prev ? {...prev, y: parseInt(text) || 0} : null)}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.halfInput}
                />
              </View>

              <TextInput
                label="延迟 (毫秒)"
                value={editingPoint?.delay.toString() || ''}
                onChangeText={text => setEditingPoint(prev => prev ? {...prev, delay: parseInt(text) || 0} : null)}
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
                  onChangeText={text => setEditingPoint(prev => prev ? {...prev, jitterRange: parseInt(text) || 0} : null)}
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
                  onChangeText={text => setEditingPoint(prev => prev ? {...prev, driftSpeed: parseInt(text) || 0} : null)}
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
