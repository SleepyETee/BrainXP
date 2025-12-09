// Mind Map - Visual Note-Taking for ADHD
// Research: Visual organization helps with non-linear thinking patterns
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  PanResponder,
  Dimensions,
} from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { colors, shadows } from '../../theme/colors';
import { useSettingsStore } from '../../stores/settingsStore';
import { AnimatedView } from '../accessibility/AnimatedView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Node types with distinct colors for visual differentiation
const NODE_COLORS = {
  main: colors.primary[500],
  idea: colors.secondary[500],
  task: colors.accent[400],
  note: colors.warning[500],
  question: colors.danger[400],
} as const;

type NodeType = keyof typeof NODE_COLORS;

interface MindMapNode {
  id: string;
  text: string;
  type: NodeType;
  x: number;
  y: number;
  parentId: string | null;
  children: string[];
}

interface MindMapProps {
  initialNodes?: MindMapNode[];
  onNodesChange?: (nodes: MindMapNode[]) => void;
  title?: string;
  readOnly?: boolean;
}

// Default center node
const createCentralNode = (text: string): MindMapNode => ({
  id: 'root',
  text,
  type: 'main',
  x: SCREEN_WIDTH / 2 - 60,
  y: 150,
  parentId: null,
  children: [],
});

export const MindMap: React.FC<MindMapProps> = ({
  initialNodes,
  onNodesChange,
  title = 'My Ideas',
  readOnly = false,
}) => {
  const [nodes, setNodes] = useState<MindMapNode[]>(
    initialNodes || [createCentralNode(title)]
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [selectedType, setSelectedType] = useState<NodeType>('idea');
  
  const reduceMotion = useSettingsStore((state) => state.settings.reduceMotion);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNodePress = useCallback(
    async (nodeId: string) => {
      if (!reduceMotion) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setSelectedNodeId(nodeId === selectedNodeId ? null : nodeId);
    },
    [selectedNodeId, reduceMotion]
  );

  const handleNodeLongPress = useCallback(
    async (nodeId: string) => {
      if (readOnly || nodeId === 'root') return;
      
      if (!reduceMotion) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setEditingNodeId(nodeId);
        setEditText(node.text);
      }
    },
    [nodes, readOnly, reduceMotion]
  );

  const handleAddNode = useCallback(async () => {
    if (!selectedNodeId) return;

    if (!reduceMotion) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const parentNode = nodes.find((n) => n.id === selectedNodeId);
    if (!parentNode) return;

    // Calculate position for new node (spread around parent)
    const childCount = parentNode.children.length;
    const angle = (childCount * 60 + 30) * (Math.PI / 180);
    const distance = 100 + childCount * 20;
    
    const newX = parentNode.x + Math.cos(angle) * distance;
    const newY = parentNode.y + Math.sin(angle) * distance;

    const newNode: MindMapNode = {
      id: `node-${Date.now()}`,
      text: 'New idea',
      type: selectedType,
      x: newX,
      y: newY,
      parentId: selectedNodeId,
      children: [],
    };

    const updatedNodes = nodes.map((node) =>
      node.id === selectedNodeId
        ? { ...node, children: [...node.children, newNode.id] }
        : node
    );

    const newNodes = [...updatedNodes, newNode];
    setNodes(newNodes);
    onNodesChange?.(newNodes);
    setEditingNodeId(newNode.id);
    setEditText('New idea');
  }, [selectedNodeId, selectedType, nodes, onNodesChange, reduceMotion]);

  const handleDeleteNode = useCallback(async () => {
    if (!selectedNodeId || selectedNodeId === 'root') return;

    if (!reduceMotion) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    // Recursive delete function
    const getDescendants = (nodeId: string): string[] => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return [nodeId];
      return [nodeId, ...node.children.flatMap(getDescendants)];
    };

    const toDelete = new Set(getDescendants(selectedNodeId));
    const deletedNode = nodes.find((n) => n.id === selectedNodeId);

    // Remove node and update parent's children array
    const newNodes = nodes
      .filter((n) => !toDelete.has(n.id))
      .map((n) =>
        n.id === deletedNode?.parentId
          ? { ...n, children: n.children.filter((c) => c !== selectedNodeId) }
          : n
      );

    setNodes(newNodes);
    onNodesChange?.(newNodes);
    setSelectedNodeId(null);
  }, [selectedNodeId, nodes, onNodesChange, reduceMotion]);

  const handleSaveEdit = useCallback(() => {
    if (!editingNodeId || !editText.trim()) return;

    const newNodes = nodes.map((n) =>
      n.id === editingNodeId ? { ...n, text: editText.trim() } : n
    );
    setNodes(newNodes);
    onNodesChange?.(newNodes);
    setEditingNodeId(null);
    setEditText('');
  }, [editingNodeId, editText, nodes, onNodesChange]);

  // Render connection lines between nodes
  const renderConnections = () => {
    const lines: React.ReactElement[] = [];
    
    nodes.forEach((node) => {
      if (node.parentId) {
        const parent = nodes.find((n) => n.id === node.parentId);
        if (parent) {
          lines.push(
            <Line
              key={`line-${node.id}`}
              x1={parent.x + 50}
              y1={parent.y + 25}
              x2={node.x + 50}
              y2={node.y + 25}
              stroke={colors.gray[200]}
              strokeWidth={2}
            />
          );
        }
      }
    });

    return lines;
  };

  // Render a single node
  const renderNode = (node: MindMapNode, index: number) => {
    const isSelected = node.id === selectedNodeId;
    const isEditing = node.id === editingNodeId;
    const nodeColor = NODE_COLORS[node.type];
    const isRoot = node.id === 'root';

    return (
      <AnimatedView
        key={node.id}
        delay={index * 30}
        animation="scale"
        style={[
          styles.nodeContainer,
          { left: node.x, top: node.y },
        ]}
      >
        <TouchableOpacity
          onPress={() => handleNodePress(node.id)}
          onLongPress={() => handleNodeLongPress(node.id)}
          activeOpacity={0.8}
          style={[
            styles.node,
            isRoot && styles.nodeRoot,
            { borderColor: nodeColor },
            isSelected && { borderColor: nodeColor, borderWidth: 3 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${node.type} node: ${node.text}`}
          accessibilityHint="Tap to select, long press to edit"
        >
          {isEditing ? (
            <TextInput
              style={[styles.nodeText, styles.nodeInput]}
              value={editText}
              onChangeText={setEditText}
              onBlur={handleSaveEdit}
              onSubmitEditing={handleSaveEdit}
              autoFocus
              multiline
              maxLength={100}
            />
          ) : (
            <>
              <View style={[styles.nodeTypeIndicator, { backgroundColor: nodeColor }]} />
              <Text
                style={[styles.nodeText, isRoot && styles.nodeTextRoot]}
                numberOfLines={3}
              >
                {node.text}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </AnimatedView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mind Map</Text>
          <Text style={styles.headerSubtitle}>
            Visualize connections between ideas
          </Text>
        </View>
      </View>

      {/* Info tip */}
      <View style={styles.tipContainer}>
        <Text style={styles.tipIcon}>💡</Text>
        <Text style={styles.tipText}>
          Tap a node to select it, then add connected ideas. Long press to edit text.
        </Text>
      </View>

      {/* Node type selector */}
      {!readOnly && (
        <View style={styles.typeSelector}>
          <Text style={styles.typeSelectorLabel}>New node type:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.typeButtons}>
              {(Object.keys(NODE_COLORS) as NodeType[])
                .filter((t) => t !== 'main')
                .map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      { borderColor: NODE_COLORS[type] },
                      selectedType === type && {
                        backgroundColor: `${NODE_COLORS[type]}20`,
                      },
                    ]}
                    onPress={() => setSelectedType(type)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selectedType === type }}
                  >
                    <View
                      style={[styles.typeButtonDot, { backgroundColor: NODE_COLORS[type] }]}
                    />
                    <Text style={[styles.typeButtonText, { color: NODE_COLORS[type] }]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Canvas */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.canvas}
        contentContainerStyle={styles.canvasContent}
        horizontal
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          contentContainerStyle={styles.canvasInner}
          showsVerticalScrollIndicator={false}
        >
          {/* Connection lines */}
          <Svg
            style={StyleSheet.absoluteFill}
            width="100%"
            height="100%"
          >
            {renderConnections()}
          </Svg>

          {/* Nodes */}
          {nodes.map((node, index) => renderNode(node, index))}
        </ScrollView>
      </ScrollView>

      {/* Action buttons */}
      {!readOnly && selectedNodeId && (
        <AnimatedView animation="fadeInUp" style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteNode}
            disabled={selectedNodeId === 'root'}
            accessibilityLabel="Delete selected node"
          >
            <Text style={styles.actionButtonText}>🗑️ Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.addButton]}
            onPress={handleAddNode}
            accessibilityLabel="Add connected node"
          >
            <Text style={[styles.actionButtonText, styles.addButtonText]}>
              + Add Connected
            </Text>
          </TouchableOpacity>
        </AnimatedView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[900],
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 2,
  },

  // Tip
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    backgroundColor: colors.secondary[50],
    borderRadius: 10,
  },
  tipIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: colors.secondary[700],
    lineHeight: 18,
  },

  // Type selector
  typeSelector: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  typeSelectorLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[600],
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  typeButtonDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Canvas
  canvas: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  canvasContent: {
    minWidth: SCREEN_WIDTH * 2,
    minHeight: 600,
  },
  canvasInner: {
    minWidth: SCREEN_WIDTH * 2,
    minHeight: 600,
    position: 'relative',
  },

  // Node
  nodeContainer: {
    position: 'absolute',
  },
  node: {
    width: 100,
    minHeight: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    padding: 8,
    ...shadows.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeRoot: {
    width: 120,
    minHeight: 60,
    borderRadius: 16,
  },
  nodeTypeIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nodeText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[800],
    textAlign: 'center',
    lineHeight: 17,
  },
  nodeTextRoot: {
    fontSize: 15,
    fontWeight: '700',
  },
  nodeInput: {
    width: '100%',
    textAlign: 'center',
    padding: 0,
  },

  // Action bar
  actionBar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    ...shadows.md,
  },
  deleteButton: {
    backgroundColor: colors.gray[100],
  },
  addButton: {
    backgroundColor: colors.primary[500],
    flex: 2,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[700],
  },
  addButtonText: {
    color: '#FFFFFF',
  },
});

export default MindMap;
