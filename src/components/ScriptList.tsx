import React, {useState, useCallback} from 'react';
import {View, StyleSheet, Alert} from 'react-native';
import {
  IconButton,
  Text,
  FAB,
  Portal,
  Dialog,
  Button,
  TextInput,
  Card,
  Chip,
} from 'react-native-paper';
import {useClickStore} from '../store/clickStore';
import {Script} from '../types';
import {COLORS} from '../constants/config';

interface ScriptListProps {
  onEditScript: (scriptId: string) => void;
  onRunScript: (scriptId: string) => void;
}

const ScriptList: React.FC<ScriptListProps> = ({onEditScript, onRunScript}) => {
  const {
    scripts,
    activeScriptId,
    execution,
    addScript,
    updateScript,
    deleteScript,
    duplicateScript,
    setActiveScript,
    toggleScript,
  } = useClickStore();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [newScriptName, setNewScriptName] = useState('');
  const [newScriptDescription, setNewScriptDescription] = useState('');

  const handleAddScript = () => {
    if (!newScriptName.trim()) {
      Alert.alert('错误', '请输入脚本名称');
      return;
    }
    addScript(newScriptName.trim(), newScriptDescription.trim() || undefined);
    setShowAddDialog(false);
    setNewScriptName('');
    setNewScriptDescription('');
  };

  const handleEditScript = (script: Script) => {
    setEditingScript(script);
    setNewScriptName(script.name);
    setNewScriptDescription(script.description || '');
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (editingScript && newScriptName.trim()) {
      updateScript(editingScript.id, {
        name: newScriptName.trim(),
        description: newScriptDescription.trim() || undefined,
      });
      setShowEditDialog(false);
      setEditingScript(null);
      setNewScriptName('');
      setNewScriptDescription('');
    }
  };

  const handleDeleteScript = useCallback((script: Script) => {
    Alert.alert(
      '确认删除',
      `确定要删除脚本"${script.name}"吗？此操作不可恢复。`,
      [
        {text: '取消'},
        {
          text: '删除',
          style: 'destructive',
          onPress: () => deleteScript(script.id),
        },
      ],
    );
  }, [deleteScript]);

  const handleDuplicateScript = useCallback((script: Script) => {
    duplicateScript(script.id);
  }, [duplicateScript]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderScriptItem = (script: Script) => {
    const isActive = activeScriptId === script.id;
    const isRunning = execution.isRunning && execution.activeScriptId === script.id;

    return (
      <Card
        key={script.id}
        style={[
          styles.scriptCard,
          isActive && styles.activeCard,
          isRunning && styles.runningCard,
        ]}
        onPress={() => setActiveScript(script.id)}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <Text variant="titleMedium" style={styles.scriptName}>
                {script.name}
              </Text>
              <View style={styles.chipContainer}>
                <Chip
                  mode="outlined"
                  compact
                  style={styles.chip}
                >
                  {script.points.length} 个点位
                </Chip>
                {!script.enabled && (
                  <Chip
                    mode="outlined"
                    compact
                    style={[styles.chip, styles.disabledChip]}
                  >
                    已禁用
                  </Chip>
                )}
                {isRunning && (
                  <Chip
                    mode="flat"
                    compact
                    style={[styles.chip, styles.runningChip]}
                  >
                    运行中
                  </Chip>
                )}
              </View>
            </View>
            <View style={styles.actionButtons}>
              <IconButton
                icon="pencil-outline"
                size={20}
                onPress={() => handleEditScript(script)}
              />
              <IconButton
                icon="content-copy"
                size={20}
                onPress={() => handleDuplicateScript(script)}
              />
              <IconButton
                icon="delete-outline"
                size={20}
                onPress={() => handleDeleteScript(script)}
              />
            </View>
          </View>

          {script.description && (
            <Text variant="bodySmall" style={styles.description}>
              {script.description}
            </Text>
          )}

          <Text variant="bodySmall" style={styles.updateTime}>
            更新于 {formatDate(script.updatedAt)}
          </Text>
        </Card.Content>

        <Card.Actions style={styles.cardActions}>
          <Button
            mode="outlined"
            compact
            onPress={() => toggleScript(script.id)}
          >
            {script.enabled ? '禁用' : '启用'}
          </Button>
          <Button
            mode="outlined"
            compact
            icon="pencil"
            onPress={() => onEditScript(script.id)}
          >
            编辑点位
          </Button>
          <Button
            mode="contained"
            compact
            icon={isRunning ? 'stop' : 'play'}
            onPress={() => onRunScript(script.id)}
            disabled={!script.enabled || script.points.length === 0}
          >
            {isRunning ? '停止' : '运行'}
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {scripts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>暂无脚本</Text>
            <Text style={styles.emptySubtext}>点击下方按钮创建您的第一个脚本</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {scripts.map(renderScriptItem)}
          </View>
        )}
      </View>

      <FAB
        icon="plus"
        label="新建脚本"
        style={styles.fab}
        onPress={() => setShowAddDialog(true)}
      />

      {/* 新建脚本对话框 */}
      <Portal>
        <Dialog visible={showAddDialog} onDismiss={() => setShowAddDialog(false)}>
          <Dialog.Title>新建脚本</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="脚本名称"
              value={newScriptName}
              onChangeText={setNewScriptName}
              mode="outlined"
              style={styles.input}
              placeholder="例如：游戏自动刷图"
            />
            <TextInput
              label="描述（可选）"
              value={newScriptDescription}
              onChangeText={setNewScriptDescription}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={2}
              placeholder="简要描述脚本用途"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddDialog(false)}>取消</Button>
            <Button onPress={handleAddScript}>创建</Button>
          </Dialog.Actions>
        </Dialog>

        {/* 编辑脚本对话框 */}
        <Dialog visible={showEditDialog} onDismiss={() => setShowEditDialog(false)}>
          <Dialog.Title>编辑脚本</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="脚本名称"
              value={newScriptName}
              onChangeText={setNewScriptName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="描述（可选）"
              value={newScriptDescription}
              onChangeText={setNewScriptDescription}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={2}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowEditDialog(false)}>取消</Button>
            <Button onPress={handleSaveEdit}>保存</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  scriptCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  activeCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  runningCard: {
    backgroundColor: '#e8f5e9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
  },
  scriptName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  chip: {
    marginRight: 4,
    marginBottom: 4,
    height: 24,
  },
  disabledChip: {
    backgroundColor: '#ffebee',
  },
  runningChip: {
    backgroundColor: '#c8e6c9',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  description: {
    color: '#666',
    marginTop: 8,
  },
  updateTime: {
    color: '#999',
    marginTop: 4,
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingTop: 0,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  input: {
    marginBottom: 12,
  },
});

export default ScriptList;
