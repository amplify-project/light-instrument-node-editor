import { useState, useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  ReactFlowProvider,
  useReactFlow,
  Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { save, open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

import { BooleanNode } from "./components/nodes/math/BooleanNode";
import { ButtonNode } from "./components/nodes/io/ButtonNode";
import { ClampNode } from "./components/nodes/processing/ClampNode";
import { CommandNode } from "./components/nodes/action/CommandNode";
import { CompareNode } from "./components/nodes/math/CompareNode";
import { CounterNode } from "./components/nodes/math/CounterNode";
import { CsvWriterNode } from "./components/nodes/io/CsvWriterNode";
import { CumulativeSumNode } from "./components/nodes/math/CumulativeSumNode";
import { DeadbandNode } from "./components/nodes/processing/DeadbandNode";
import { DerivativeNode } from "./components/nodes/processing/DerivativeNode";
import { DeviceFilterNode } from "./components/nodes/processing/DeviceFilterNode";
import { EdgeTriggerNode } from "./components/nodes/math/EdgeTriggerNode";
import { EnvelopeFollowerNode } from "./components/nodes/processing/EnvelopeFollowerNode";
import { FrameNode } from "./components/nodes/layout/FrameNode";
import { FunctionGeneratorNode } from "./components/nodes/io/FunctionGeneratorNode";
import { GateNode } from "./components/nodes/math/GateNode";
import { GraphNode } from "./components/nodes/display/GraphNode";
import { HysteresisNode } from "./components/nodes/math/HysteresisNode";
import { LogNode } from "./components/nodes/display/LogNode";
import { MapRangeNode } from "./components/nodes/processing/MapRangeNode";
import { MathNode } from "./components/nodes/math/MathNode";
import { MedianFilterNode } from "./components/nodes/processing/MedianFilterNode";
import { MovingAverageNode } from "./components/nodes/processing/MovingAverageNode";
import { NodeSearch } from "./components/NodeSearch";
import { PeakDetectionNode } from "./components/nodes/math/PeakDetectionNode";
import { QuantizeNode } from "./components/nodes/processing/QuantizeNode";
import { RateNode } from "./components/nodes/processing/RateNode";
import { SerialInputNode } from "./components/nodes/io/SerialInputNode";
import { SerialOutputNode } from "./components/nodes/io/SerialOutputNode";
import { SimulateNode } from "./components/nodes/io/SimulateNode";
import { ValueNode } from "./components/nodes/io/ValueNode";
import { SmoothNode } from "./components/nodes/processing/SmoothNode";
import { StatisticsNode } from "./components/nodes/display/StatisticsNode";
import { TimerNode } from "./components/nodes/math/TimerNode";
import { ToggleNode } from "./components/nodes/math/ToggleNode";

import "./App.css";

const nodeTypes = {
  serialInput: SerialInputNode,
  serialOutput: SerialOutputNode,
  csvWriter: CsvWriterNode,
  deviceFilter: DeviceFilterNode,
  peakDetection: PeakDetectionNode,
  command: CommandNode,
  graph: GraphNode,
  compare: CompareNode,
  counter: CounterNode,
  boolean: BooleanNode,
  log: LogNode,
  statistics: StatisticsNode,
  smooth: SmoothNode,
  simulate: SimulateNode,
  value: ValueNode,
  button: ButtonNode,
  movingAverage: MovingAverageNode,
  medianFilter: MedianFilterNode,
  deadband: DeadbandNode,
  mapRange: MapRangeNode,
  clamp: ClampNode,
  quantize: QuantizeNode,
  derivative: DerivativeNode,
  envelopeFollower: EnvelopeFollowerNode,
  hysteresis: HysteresisNode,
  gate: GateNode,
  toggle: ToggleNode,
  edgeTrigger: EdgeTriggerNode,
  timer: TimerNode,
  math: MathNode,
  functionGenerator: FunctionGeneratorNode,
  cumulativeSum: CumulativeSumNode,
  rate: RateNode,
  frame: FrameNode,
};

const initialNodes: Node[] = [
  {
    id: "input-1",
    type: "serialInput",
    position: { x: 50, y: 100 },
    data: { label: "Serial Input" },
    deletable: false,
  },
  {
    id: "output-1",
    type: "serialOutput",
    position: { x: 1000, y: 120 },
    data: { label: "Serial Output" },
    deletable: false,
  },
];

const initialEdges: Edge[] = [];
const ALLOWS_MULTI_INPUT = ["serialOutput", "log", "statistics", "csvWriter"];

function Flow() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [discoveredDevices, setDiscoveredDevices] = useState<{ sensors: Set<string>, actuators: Set<string> }>({ sensors: new Set(), actuators: new Set()});
  const [isDirty, setIsDirty] = useState(false);
  const [searchState, setSearchState] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0,
  });

  const [activePort, setActivePort] = useState<string | null>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const { screenToFlowPosition } = useReactFlow();

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onAddNode = useCallback((type: string) => {
    if (type === "serialInput" || type === "serialOutput") {
      return;
    }

    const position = screenToFlowPosition({
      x: searchState.x,
      y: searchState.y,
    });

    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: { label: type.charAt(0).toUpperCase() + type.slice(1) },
      zIndex: type === "frame" ? -1 : undefined,
      width: type === "frame" ? 300 : undefined,
      height: type === "frame" ? 200 : undefined,
    };

    setNodes((nds) => nds.concat(newNode));
    setIsDirty(true);
    setSearchState((prev) => ({ ...prev, visible: false }));
  }, [searchState, screenToFlowPosition]);

  // Ref to store consumers for output nodes
  const consumers = useRef<{ [id: string]: (data: any, handleId?: string | null) => void }>({});

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (targetNode && ALLOWS_MULTI_INPUT.some((type) => type == targetNode.type)) {
        return true;
      }

      // For all other nodes, only allow one connection per input handle
      const existingEdge = edges.find(
        (edge) =>
          edge.target === connection.target &&
          (edge.targetHandle ?? null) === (connection.targetHandle ?? null)
      );

      if (existingEdge && (connection as any).id === existingEdge.id) {
        return true;
      }

      return !existingEdge;
    },
    [nodes, edges]
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds));

      if (changes.some((c) => c.type !== "select")) {
        setIsDirty(true);
      }
    },
    [setNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));

      if (changes.some((c) => c.type !== "select")) {
        setIsDirty(true);
      }
    },
    [setEdges]
  );

  const onConnect: OnConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge(params, eds));
      setIsDirty(true);

      const sourceNode = nodes.find((n) => n.id === params.source);

      if (sourceNode?.type === "value") {
        const consumer = consumers.current[params.target];

        if (consumer) {
          consumer(
            {
              device: "value",
              port: "out",
              value: sourceNode.data.value ?? 0,
            },
            params.targetHandle
          );
        }
      }
    },
    [setEdges, nodes]
  );

  const onData = useCallback((sourceId: string, data: any) => {
    // Check if the message came from the serial input node and is of type "deviceDiscovery"
    if (sourceId == "input-1" && data?.type == "deviceDiscovery") {
      const { deviceType, deviceName } = data;

      setDiscoveredDevices({
        sensors: (deviceType == "sensor") ? discoveredDevices.sensors.add(deviceName) : discoveredDevices.sensors,
        actuators: (deviceType == "actuator") ? discoveredDevices.actuators.add(deviceName) : discoveredDevices.actuators
      })

      return;
    }

    // Find edges connected to this source
    const connectedEdges = edges.filter((e) => e.source === sourceId);

    connectedEdges.forEach((edge) => {
      const consumer = consumers.current[edge.target];

      if (consumer) {
        consumer(data, edge.targetHandle);
      }
    });
  }, [edges]);

  const registerConsumer = useCallback((id: string, consumer: (data: any, handleId?: string | null) => void) => {
    consumers.current[id] = consumer;
  }, []);

  const unregisterConsumer = useCallback((id: string) => {
    delete consumers.current[id];
  }, []);

  const updateNodeData = useCallback((id: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, ...newData } };
        }

        return node;
      })
    );
    setIsDirty(true);
  }, []);

  const onDeleteNode = useCallback((id: string) => {
    setNodes((nds) => {
      const node = nds.find((n) => n.id === id);

      if (node?.type === "serialInput" || node?.type === "serialOutput") {
        return nds;
      }

      return nds.filter((n) => n.id !== id);
    });

    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    setIsDirty(true);
  }, []);

  const handleSaveAs = useCallback(async () => {
    try {
      const path = await save({
        filters: [{ name: "Light Instrument Nodes", extensions: ["lns"] }],
        defaultPath: currentPath || "node_setup.lns",
      });

      if (path) {
        const setup = { nodes, edges };
        await invoke("save_file", { path, contents: JSON.stringify(setup, null, 2) });
        setCurrentPath(path);
        setIsDirty(false);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save: " + e);
    }
  }, [nodes, edges, currentPath]);

  const onSave = useCallback(async () => {
    if (!currentPath) {
      return handleSaveAs();
    }

    try {
      const setup = { nodes, edges };
      await invoke("save_file", { path: currentPath, contents: JSON.stringify(setup, null, 2) });
      setIsDirty(false);
    } catch (e) {
      console.error(e);
      alert("Failed to save: " + e);
    }
  }, [nodes, edges, currentPath, handleSaveAs]);

  const applySetup = useCallback((setup: any, path: string | null) => {
    if (setup.nodes && setup.edges) {
      let newNodes: Node[] = setup.nodes;

      // Ensure exactly one serialInput
      const inputNodes = newNodes.filter((n) => n.type === "serialInput");

      if (inputNodes.length === 0) {
        newNodes.push({
          id: "input-1",
          type: "serialInput",
          position: { x: 100, y: 100 },
          data: { label: "Serial Input" },
          deletable: false,
        });
      } else if (inputNodes.length > 1) {
        const firstInput = inputNodes[0];
        newNodes = newNodes.filter((n) => n.type !== "serialInput" || n.id === firstInput.id);
      }

      // Ensure exactly one serialOutput
      const outputNodes = newNodes.filter((n) => n.type === "serialOutput");

      if (outputNodes.length === 0) {
        newNodes.push({
          id: "output-1",
          type: "serialOutput",
          position: { x: 500, y: 100 },
          data: { label: "Serial Output" },
          deletable: false,
        });
      } else if (outputNodes.length > 1) {
        const firstOutput = outputNodes[0];
        newNodes = newNodes.filter((n) => n.type !== "serialOutput" || n.id === firstOutput.id);
      }

      // Ensure they are marked non-deletable
      newNodes = newNodes.map((n) => {
        if (n.type === "serialInput" || n.type === "serialOutput") {
          return { ...n, deletable: false };
        }

        return n;
      });

      setNodes(newNodes);
      setEdges(setup.edges);
      setCurrentPath(path);
      setIsDirty(false);
    }
  }, []);

  const onOpen = useCallback(async () => {
    try {
      const path = await open({
        filters: [{ name: "Light Instrument Nodes", extensions: ["lns"] }],
        multiple: false,
      });

      if (path) {
        const contents = await invoke<string>("load_file", { path });
        const setup = JSON.parse(contents);
        applySetup(setup, path);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to load: " + e);
    }
  }, [applySetup]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave();
      } else if (e.shiftKey && e.key.toLowerCase() === "a") {
        const target = e.target as HTMLElement;

        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
          return;
        }

        e.preventDefault();

        setSearchState({
          visible: true,
          x: mousePos.current.x,
          y: mousePos.current.y,
        });
      }
    },
    [onSave]
  );

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleMouseMove, handleKeyDown]);

  // Enrich nodes with data flow callbacks
  const enrichedNodes = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onData,
      registerConsumer,
      unregisterConsumer,
      onDelete: onDeleteNode,
      updateNodeData,
      activePort,
      setActivePort,
    },
  }));

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={enrichedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#333" gap={20} />
        <Controls />
      </ReactFlow>

      <div className="file-controls">
        <div className="file-info">
          {currentPath ? currentPath.split("/").pop()?.split("\\").pop() : "Untitled"}
          {isDirty ? "*" : ""}
        </div>
        <button onClick={onOpen}>Open</button>
        <button onClick={onSave}>Save</button>
        <button onClick={handleSaveAs}>Save As</button>
      </div>

      {(discoveredDevices.sensors.size > 0 || discoveredDevices.actuators.size > 0) && (
        <div className="discovered-devices">
          <div className="discovered-devices-header">Sensors</div>
          {Array.from(discoveredDevices.sensors).map((deviceName) => {
            return (<div key={deviceName}>{deviceName}</div>);
          })}

          <div className="discovered-devices-header">Actuators</div>
          {Array.from(discoveredDevices.actuators).map((deviceName) => {
            return (<div key={deviceName}>{deviceName}</div>);
          })}
        </div>
      )}

      {searchState.visible && (
        <NodeSearch
          x={searchState.x}
          y={searchState.y}
          onSelect={onAddNode}
          onClose={() => setSearchState((prev) => ({ ...prev, visible: false }))}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}

export default App;
