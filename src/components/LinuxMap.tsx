import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  getSmoothStepPath,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeMouseHandler,
  type NodeProps,
} from "@xyflow/react";
import { type CSSProperties, useMemo } from "react";
import { kernelEdges } from "../data/edges";
import { kernelNodes } from "../data/nodes";
import type { Layer } from "../types";
import { edgeTypeLabels, layerColors, layerNames, nodeById } from "../utils/model";

type LinuxMapProps = {
  selectedNodeId: string;
  activeNodeIds: string[];
  activeEdgeIds: string[];
  pathNodeIds: string[];
  onSelectNode: (nodeId: string) => void;
};

type NodeState = "idle" | "active" | "path" | "selected";

type ModelNodeData = {
  title: string;
  category: string;
  layer: Layer;
  color: string;
  state: NodeState;
};

type PacketEdgeData = {
  label?: string;
  animated: boolean;
  color: string;
};

// Кастомный узел: react-flow навешивает translate на обёртку .react-flow__node,
// а мой внутренний .modelNode свободен — его можно масштабировать (эффект
// "возвышения") без конфликта с позиционированием.
function ModelNode({ data }: NodeProps) {
  const d = data as unknown as ModelNodeData;
  return (
    <div
      className={`modelNode modelNode-${d.layer} modelNode-${d.state}`}
      style={{ borderTopColor: d.color, ["--node-color" as string]: d.color } as CSSProperties}
    >
      <Handle type="target" position={Position.Top} className="modelHandle" isConnectable={false} />
      <div className="modelNodeBody">
        <strong>{d.title}</strong>
        <span>{d.category}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="modelHandle" isConnectable={false} />
    </div>
  );
}

// Кастомное ребро: рисуем smoothstep-путь и, когда связь активна, пускаем по нему
// "пакет" (кружок) через <animateMotion> — как анимация письма в Cisco Packet Tracer.
function PacketEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const d = (data ?? { animated: false, color: "#64748b" }) as unknown as PacketEdgeData;

  // Пока узлы не измерены, координаты могут быть NaN. Невалидный path в
  // <animateMotion> способен кинуть исключение в SMIL-движке и обрушить дерево,
  // поэтому анимацию пакета рисуем только при корректной геометрии.
  const hasValidGeometry = [sourceX, sourceY, targetX, targetY].every((value) => Number.isFinite(value));

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {d.animated && hasValidGeometry && (
        <circle className="edgePacket" r={5.5} fill={d.color}>
          <animateMotion dur="1.7s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
      {d.animated && hasValidGeometry && d.label && (
        <EdgeLabelRenderer>
          <div
            className="edgeFloatLabel"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {d.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const nodeTypes = { model: ModelNode };
const edgeTypes = { packet: PacketEdge };

const layerBaseY: Record<Layer, number> = {
  hardware: 96,
  kernel: 570,
  userspace: 1510,
  observability: 2130,
};

const layerColumns: Record<Layer, number> = {
  hardware: 4,
  kernel: 7,
  userspace: 5,
  observability: 6,
};

const layerSpacingY: Record<Layer, number> = {
  hardware: 152,
  kernel: 152,
  userspace: 152,
  observability: 152,
};

const nodeSpacingX = 310;
const nodeWidth = 220;
const nodeHeight = 82;
const layerPaddingX = 80;
const layerPaddingTop = 118;
const layerPaddingBottom = 108;

const layerOrder: Layer[] = ["hardware", "kernel", "userspace", "observability"];

const makePosition = (layer: Layer, indexInLayer: number) => {
  const columns = layerColumns[layer];
  const column = indexInLayer % columns;
  const row = Math.floor(indexInLayer / columns);
  return {
    x: column * nodeSpacingX,
    y: layerBaseY[layer] + row * layerSpacingY[layer],
  };
};

const layerAreaSize = (layer: Layer, nodeCount: number) => {
  const rows = Math.max(1, Math.ceil(nodeCount / layerColumns[layer]));
  return {
    width: (layerColumns[layer] - 1) * nodeSpacingX + nodeWidth + layerPaddingX * 2,
    height: (rows - 1) * layerSpacingY[layer] + 78 + layerPaddingTop + layerPaddingBottom,
  };
};

export function LinuxMap({ selectedNodeId, activeNodeIds, activeEdgeIds, pathNodeIds, onSelectNode }: LinuxMapProps) {
  const activeNodes = useMemo(() => new Set(activeNodeIds), [activeNodeIds]);
  const activeEdges = useMemo(() => new Set(activeEdgeIds), [activeEdgeIds]);
  const pathNodes = useMemo(() => new Set(pathNodeIds), [pathNodeIds]);

  const nodes: Node[] = useMemo(() => {
    const layerTotals = layerOrder.reduce<Record<Layer, number>>(
      (totals, layer) => ({
        ...totals,
        [layer]: kernelNodes.filter((kernelNode) => kernelNode.layer === layer).length,
      }),
      {
        hardware: 0,
        kernel: 0,
        userspace: 0,
        observability: 0,
      },
    );

    const layerAreas: Node[] = layerOrder.map((layer) => {
      const size = layerAreaSize(layer, layerTotals[layer]);
      return {
        id: `layer-area-${layer}`,
        position: {
          x: -layerPaddingX,
          y: layerBaseY[layer] - layerPaddingTop,
        },
        data: {
          label: (
            <div className="layerAreaLabel">
              <strong>{layerNames[layer]}</strong>
              <span>{layerTotals[layer]} узлов</span>
            </div>
          ),
        },
        className: ["layerArea", `layerArea-${layer}`].join(" "),
        selectable: false,
        draggable: false,
        connectable: false,
        focusable: false,
        zIndex: -100,
        style: {
          width: size.width,
          height: size.height,
          borderColor: layerColors[layer],
        },
      };
    });

    const layerCounters: Record<Layer, number> = {
      hardware: 0,
      kernel: 0,
      userspace: 0,
      observability: 0,
    };

    const modelNodes: Node[] = kernelNodes.map((kernelNode) => {
      const indexInLayer = layerCounters[kernelNode.layer];
      layerCounters[kernelNode.layer] += 1;

      const isSelected = kernelNode.id === selectedNodeId;
      const isPath = pathNodes.has(kernelNode.id);
      const isActive = activeNodes.has(kernelNode.id);
      const state: NodeState = isSelected ? "selected" : isPath ? "path" : isActive ? "active" : "idle";

      return {
        id: kernelNode.id,
        type: "model",
        position: makePosition(kernelNode.layer, indexInLayer),
        // Явные размеры: react-flow знает геометрию узла и позиции handle сразу,
        // без кадра с неизмеренными (NaN) координатами при перестройке во время
        // проигрывания сценария.
        width: nodeWidth,
        height: nodeHeight,
        data: {
          title: kernelNode.title,
          category: kernelNode.category,
          layer: kernelNode.layer,
          color: layerColors[kernelNode.layer],
          state,
        } satisfies ModelNodeData,
        zIndex: state === "idle" ? 1 : 6,
      };
    });

    return [...layerAreas, ...modelNodes];
  }, [activeNodes, pathNodes, selectedNodeId]);

  const edges: Edge[] = useMemo(
    () =>
      kernelEdges
        .filter((kernelEdge) => nodeById.has(kernelEdge.source) && nodeById.has(kernelEdge.target))
        .map((kernelEdge) => {
          const isActive = activeEdges.has(kernelEdge.id);
          const color = isActive ? "#facc15" : "rgba(100, 116, 139, 0.48)";
          return {
            id: kernelEdge.id,
            source: kernelEdge.source,
            target: kernelEdge.target,
            type: "packet",
            animated: isActive,
            zIndex: isActive ? 4 : 0,
            data: {
              label: isActive ? edgeTypeLabels[kernelEdge.type] : undefined,
              animated: isActive,
              color: isActive ? "#facc15" : "#64748b",
            } satisfies PacketEdgeData,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isActive ? "#facc15" : "#64748b",
            },
            style: {
              opacity: isActive ? 1 : 0.34,
              stroke: color,
              strokeWidth: isActive ? 3 : 0.9,
            },
          };
        }),
    [activeEdges],
  );

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    if (node.id.startsWith("layer-area-")) {
      return;
    }
    onSelectNode(node.id);
  };

  return (
    <section className="graphShell" aria-label="Интерактивная карта Linux">
      <div className="layerLegend">
        {(Object.keys(layerNames) as Layer[]).map((layer) => (
          <span key={layer}>
            <i style={{ backgroundColor: layerColors[layer] }} />
            {layerNames[layer]}
          </span>
        ))}
      </div>
      <ReactFlowProvider>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        defaultViewport={{ x: 36, y: 72, zoom: 0.78 }}
        minZoom={0.35}
        maxZoom={1.6}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgba(148, 163, 184, 0.16)" gap={28} />
        <Controls showInteractive={false} />
      </ReactFlow>
      </ReactFlowProvider>
    </section>
  );
}
