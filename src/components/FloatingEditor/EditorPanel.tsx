import React, {useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  PanResponder,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  IconButton,
  Surface,
  Button,
  Divider,
  Portal,
  Dialog,
  TextInput,
  Switch,
} from 'react-native-paper';
import {ClickPoint} from '../../types';
import {EDITOR_CONFIG, APP_CONFIG} from '../../constants/config';

interface EditorPanelProps {
  scriptName: string;
  points: ClickPoint[];
  selectedPointId: string | null;
  onSelectPoint: (pointId: string | null) => void;
  onAddPoint: () => void;
  onDeletePoint: (pointId: string) => void;
  onUpdatePoint: (pointId: string, updates: Partial<ClickPoint>) => void;
  onClose: () => void;
}

/**
 * 编辑器操作面板
 */
const EditorPanel: React.FC<EditorPanelProps> = ({
  scriptName,
  points,
  selectedPointId,
  onSelectPoint,
  onAddPoint,
  onDeletePoint,
  onUpdatePoint,
  onClose,
}) => {
  const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
  const [position, setPosition] = useState({x: 16, y: 100});
  const [minimized, setMinimized] = useState(false);
  const [editingPoint, setEditingPoint] = useState<ClickPoint | null>(null);
  const positionRef = useRef(position);

  // 拖动面板
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        positionRef.current = position;
      },
      onPanResponderMove: (_, gestureState) => {
        const newX = Math.max(
          0,
          Math.min(
            screenWidth - EDITOR_CONFIG.PANEL_WIDTH,
            positionRef.current.x + gestureState.dx,
          ),
        );
        const newY = Math.max(
          0,
          Math.min(screenHeight - 100, positionRef.current.y + gestureState.dy),
        );
        setPosition({x: newX, y: newY});
      },
      onPanResponderRelease: (_, gestureState) => {
        const newX = Math.max(
          0,
          Math.min(
            screenWidth - EDITOR_CONFIG.PANEL_WIDTH,
            positionRef.current.x + gestureState.dx,
          ),
        );
        const newY = Math.max(
          0,
          Math.min(screenHeight - 100, positionRef.current.y + gestureState.dy),
        );
        setPosition({x: newX, y: newY});
        positionRef.current = {x: newX, y: newY};
      },
    }),
  ).current;

  const selectedPoint = points.find(p => p.id === selectedPointId);

  const handleSaveEdit = () => {
    if (editingPoint) {
      onUpdatePoint(editingPoint.id, editingPoint);
      setEditingPoint(null);
    }
  };

  return (
    <>
      <Surface
        style={[
          styles.panel,
          {
            left: position.x,
            top: position.y,
            width: EDITOR_CONFIG.PANEL_WIDTH,
          },
          minimized && styles.minimizedPanel,
        ]}
        elevation={5}
      >
        {/* 标题栏 - 可拖动 */}
        <View style={styles.header} {...panResponder.panHandlers}>
          <Text style={styles.title} numberOfLines={1}>
            📝 {scriptName}
          </Text>
          <View style={styles.headerButtons}>
            <IconButton
              icon={minimized ? 'chevron-down' : 'chevron-up'}
              size={20}
              iconColor="#fff"
              onPress={() => setMinimized(!minimized)}
            />
            <IconButton
              icon="close"
              size={20}
              iconColor="#fff"
              onPress={onClose}
            />
          </View>
        </View>

        {!minimized && (
          <>
            {/* 工具栏 */}
            <View style={styles.toolbar}>
              <Button
                mode="contained"
                compact
                icon="plus"
                onPress={onAddPoint}
                disabled={points.length >= APP_CONFIG.MAX_POINTS}
                style={styles.toolButton}
              >
                添加点位
              </Button>
              {selectedPointId && (
                <Button
                  mode="outlined"
                  compact
                  icon="delete"
                  onPress={() => onDeletePoint(selectedPointId)}
                  style={styles.toolButton}
                  textColor="#f44336"
                >
                  删除
                </Button>
              )}
            </View>

            <Divider style={styles.divider} />

            {/* 点位列表 */}
            <Text style={styles.sectionTitle}>
              点位列表 ({points.length}/{APP_CONFIG.MAX_POINTS})
            </Text>
            <ScrollView style={styles.pointList}>
              {points.length === 0 ? (
                <Text style={styles.emptyText}>暂无点位，点击上方按钮添加</Text>
              ) : (
                points.map(point => (
                  <TouchableOpacity
                    key={point.id}
                    onPress={() => onSelectPoint(point.id)}
                    style={[
                      styles.pointItem,
                      selectedPointId === point.id && styles.selectedPointItem,
                    ]}
                  >
                    <View style={styles.pointInfo}>
                      <Text
                        style={[
                          styles.pointName,
                          !point.enabled && styles.disabledText,
                        ]}
                      >
                        {point.order + 1}. {point.name || `点 ${point.order + 1}`}
                      </Text>
                      <Text style={styles.pointCoord}>
                        ({Math.round(point.x)}, {Math.round(point.y)})
                      </Text>
                    </View>
                    <View style={styles.pointActions}>
                      <IconButton
                        icon="pencil"
                        size={16}
                        onPress={() => setEditingPoint({...point})}
                      />
                      <Switch
                        value={point.enabled}
                        onValueChange={value =>
                          onUpdatePoint(point.id, {enabled: value})
                        }
                        style={styles.switch}
                      />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* 选中点位信息 */}
            {selectedPoint && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.selectedInfo}>
                  <Text style={styles.sectionTitle}>当前选中</Text>
                  <Text style={styles.infoText}>
                    坐标: ({Math.round(selectedPoint.x)}, {Math.round(selectedPoint.y)})
                  </Text>
                  <Text style={styles.infoText}>
                    延迟: {selectedPoint.delay}ms
                  </Text>
                  <Text style={styles.infoText}>
                    抖动: {selectedPoint.jitter ? `±${selectedPoint.jitterRange}px` : '关'}
                  </Text>
                </View>
              </>
            )}
          </>
        )}
      </Surface>

      {/* 编辑点位对话框 */}
      <Portal>
        <Dialog
          visible={editingPoint !== null}
          onDismiss={() => setEditingPoint(null)}
        >
          <Dialog.Title>编辑点位</Dialog.Title>
          <Dialog.ScrollArea>
            <View style={styles.dialogContent}>
              <TextInput
                label="名称"
                value={editingPoint?.name || ''}
                onChangeText={text =>
                  setEditingPoint(prev => (prev ? {...prev, name: text} : null))
                }
                mode="outlined"
                style={styles.input}
              />

              <View style={styles.row}>
                <TextInput
                  label="X 坐标"
                  value={editingPoint?.x.toString() || ''}
                  onChangeText={text =>
                    setEditingPoint(prev =>
                      prev ? {...prev, x: parseInt(text, 10) || 0} : null,
                    )
                  }
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.halfInput}
                />
                <TextInput
                  label="Y 坐标"
                  value={editingPoint?.y.toString() || ''}
                  onChangeText={text =>
                    setEditingPoint(prev =>
                      prev ? {...prev, y: parseInt(text, 10) || 0} : null,
                    )
                  }
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.halfInput}
                />
              </View>

              <TextInput
                label="延迟 (毫秒)"
                value={editingPoint?.delay.toString() || ''}
                onChangeText={text =>
                  setEditingPoint(prev =>
                    prev ? {...prev, delay: parseInt(text, 10) || 0} : null,
                  )
                }
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />

              <Divider style={styles.divider} />

              <View style={styles.switchRow}>
                <Text>启用抖动</Text>
                <Switch
                  value={editingPoint?.jitter || false}
                  onValueChange={value =>
                    setEditingPoint(prev =>
                      prev ? {...prev, jitter: value} : null,
                    )
                  }
                />
              </View>

              {editingPoint?.jitter && (
                <TextInput
                  label="抖动范围 (像素)"
                  value={editingPoint?.jitterRange.toString() || ''}
                  onChangeText={text =>
                    setEditingPoint(prev =>
                      prev
                        ? {...prev, jitterRange: parseInt(text, 10) || 0}
                        : null,
                    )
                  }
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                />
              )}

              <View style={styles.switchRow}>
                <Text>启用漂移</Text>
                <Switch
                  value={editingPoint?.drift || false}
                  onValueChange={value =>
                    setEditingPoint(prev =>
                      prev ? {...prev, drift: value} : null,
                    )
                  }
                />
              </View>

              {editingPoint?.drift && (
                <TextInput
                  label="漂移速度"
                  value={editingPoint?.driftSpeed.toString() || ''}
                  onChangeText={text =>
                    setEditingPoint(prev =>
                      prev
                        ? {...prev, driftSpeed: parseInt(text, 10) || 0}
                        : null,
                    )
                  }
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
    </>
  );
};

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    backgroundColor: EDITOR_CONFIG.PANEL_BACKGROUND,
    borderRadius: 12,
    overflow: 'hidden',
  },
  minimizedPanel: {
    height: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(98, 0, 238, 0.9)',
    paddingLeft: 12,
    paddingRight: 4,
    height: 48,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  toolbar: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
  },
  toolButton: {
    flex: 1,
  },
  divider: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pointList: {
    maxHeight: 200,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    padding: 16,
    fontSize: 12,
  },
  pointItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 8,
    marginBottom: 4,
    borderRadius: 8,
  },
  selectedPointItem: {
    backgroundColor: 'rgba(33, 150, 243, 0.3)',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  pointInfo: {
    flex: 1,
  },
  pointName: {
    color: '#fff',
    fontSize: 14,
  },
  pointCoord: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  disabledText: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  pointActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switch: {
    transform: [{scale: 0.8}],
  },
  selectedInfo: {
    padding: 12,
  },
  infoText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginBottom: 4,
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
});

export default EditorPanel;
