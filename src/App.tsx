import { useState, useCallback, useRef, useEffect, useMemo } from "react";
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
  SelectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { save, open, ask } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import useInterval from "@use-it/interval";

import { BooleanNode } from "./components/nodes/math/BooleanNode";
import { ButtonNode } from "./components/nodes/io/ButtonNode";
import { ClampNode } from "./components/nodes/processing/ClampNode";
import { CombineRgbNode } from "./components/nodes/processing/CombineRgbNode";
import { CommandNode } from "./components/nodes/action/CommandNode";
import { CompareNode } from "./components/nodes/math/CompareNode";
import { CounterNode } from "./components/nodes/math/CounterNode";
import { CsvWriterNode } from "./components/nodes/io/CsvWriterNode";
import { CumulativeSumNode } from "./components/nodes/math/CumulativeSumNode";
import { DelayNode } from "./components/nodes/math/DelayNode";
import { DeadbandNode } from "./components/nodes/processing/DeadbandNode";
import { DerivativeNode } from "./components/nodes/processing/DerivativeNode";
import { DeviceFilterNode } from "./components/nodes/processing/DeviceFilterNode";
import { EdgeTriggerNode } from "./components/nodes/math/EdgeTriggerNode";
import { EnvelopeFollowerNode } from "./components/nodes/processing/EnvelopeFollowerNode";
import { FrameNode } from "./components/nodes/layout/FrameNode";
import { AnnotationNode } from "./components/nodes/layout/AnnotationNode";
import { RerouteNode } from "./components/nodes/layout/RerouteNode";
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
import { RedisNode } from "./components/nodes/io/RedisNode";
import { ScriptNode } from "./components/nodes/action/ScriptNode";
import { SerialInputNode } from "./components/nodes/io/SerialInputNode";
import { SerialOutputNode } from "./components/nodes/io/SerialOutputNode";
import { SimulateNode } from "./components/nodes/io/SimulateNode";
import { ValueNode } from "./components/nodes/io/ValueNode";
import { SmoothNode } from "./components/nodes/processing/SmoothNode";
import { StatisticsNode } from "./components/nodes/display/StatisticsNode";
import { TimerNode } from "./components/nodes/math/TimerNode";
import { ToggleNode } from "./components/nodes/math/ToggleNode";

import { AVAILABLE_COMMANDS } from "./constants";
import "./App.css";
import { getCurrentWindow } from "@tauri-apps/api/window";

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
  combineRgb: CombineRgbNode,
  quantize: QuantizeNode,
  derivative: DerivativeNode,
  envelopeFollower: EnvelopeFollowerNode,
  hysteresis: HysteresisNode,
  gate: GateNode,
  toggle: ToggleNode,
  edgeTrigger: EdgeTriggerNode,
  timer: TimerNode,
  math: MathNode,
  delay: DelayNode,
  functionGenerator: FunctionGeneratorNode,
  cumulativeSum: CumulativeSumNode,
  rate: RateNode,
  redis: RedisNode,
  script: ScriptNode,
  frame: FrameNode,
  annotation: AnnotationNode,
  reroute: RerouteNode,
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
const ALLOWS_MULTI_INPUT = ["serialOutput", "log", "statistics", "csvWriter", "reroute", "redis"];

function Flow() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [discoveredDevices, setDiscoveredDevices] = useState<{
    sensors: Map<string, [number, number]>;
    actuators: Map<string, [number, number]>;
  }>({ sensors: new Map(), actuators: new Map() });
  const discoveredDevicesRef = useRef<{
    sensors: Map<string, number>;
    actuators: Map<string, number>;
  }>({ sensors: new Map(), actuators: new Map() });
  const [isDirty, setIsDirty] = useState(false);
  const isDirtyRef = useRef(false);
  const nodesRef = useRef<Node[]>(nodes);
  const edgesRef = useRef<Edge[]>(edges);
  const adjacencyMapRef = useRef<{ [sourceId: string]: Edge[] }>({});
  const copyBufferRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;

    const map: { [sourceId: string]: Edge[] } = {};

    edges.forEach((edge) => {
      if (!map[edge.source]) {
        map[edge.source] = [];
      }

      map[edge.source].push(edge);
    });

    adjacencyMapRef.current = map;
  }, [edges]);

  const [searchState, setSearchState] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0,
  });

  const [activePort, setActivePort] = useState<string | null>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const { screenToFlowPosition } = useReactFlow();
  const [consoleData, setConsoleData] = useState({
    device: "",
    port: "",
    command: "",
    params: "",
  });

  useInterval(() => {
    setDiscoveredDevices(() => {
      const now = Date.now();
      const sensors = new Map<string, [number, number]>();

      discoveredDevicesRef.current.sensors.forEach((lastSeen, name) => {
        sensors.set(name, [lastSeen, now - lastSeen]);
      });

      const actuators = new Map<string, [number, number]>();

      discoveredDevicesRef.current.actuators.forEach((lastSeen, name) => {
        actuators.set(name, [lastSeen, now - lastSeen]);
      });

      return { sensors, actuators };
    });
  }, 2000);

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
      zIndex: (type === "frame" || type === "annotation") ? -1 : undefined,
      width: (type === "frame" || type === "annotation") ? 300 : undefined,
      height: (type === "frame" || type === "annotation") ? 200 : undefined,
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
      const sourceNode = nodes.find((n) => n.id === connection.source);

      // Serial Output only allows connections from Command, Script and Reroute nodes
      if (targetNode?.type === "serialOutput") {
        if (sourceNode?.type !== "command" && sourceNode?.type !== "script" && sourceNode?.type !== "reroute") {
          return false;
        }
      }

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
    if (sourceId === "input-1") {
      if (data?.type === "deviceDiscovery" || data?.type === "pong") {
        const { deviceType, deviceName } = data;

        if (deviceType === "sensor") {
          discoveredDevicesRef.current.sensors.set(deviceName, Date.now());
        } else if (deviceType === "actuator") {
          discoveredDevicesRef.current.actuators.set(deviceName, Date.now());
        }

        return;
      }

      // Also update lastSeen for regular data packets from sensors
      if (data?.device) {
        if (discoveredDevicesRef.current.sensors.has(data.device)) {
          discoveredDevicesRef.current.sensors.set(data.device, Date.now());
        }
      }
    }

    // Find edges connected to this source using the adjacency map
    const connectedEdges = adjacencyMapRef.current[sourceId] || [];

    connectedEdges.forEach((edge) => {
      const consumer = consumers.current[edge.target];

      if (consumer) {
        consumer(data, edge.targetHandle);
      }
    });
  }, []);

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

  const handleSendConsole = useCallback(() => {
    if (!activePort || !consoleData.command) {
      return;
    }

    const payload = `${consoleData.device},${consoleData.port},${consoleData.command},${consoleData.params}\n`;

    invoke("write_serial", { portName: activePort, data: payload }).catch(console.error);
  }, [activePort, consoleData]);

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

      // Trigger Value nodes after a short delay to ensure components are mounted and consumers registered
      setTimeout(() => {
        newNodes.forEach((node) => {
          if (node.type === "value") {
            onData(node.id, {
              device: "value",
              port: "out",
              value: node.data.value ?? 0,
            });
          }
        });
      }, 500);
    }
  }, [onData]);

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

  const onNew = useCallback(async () => {
    if (isDirty) {
      const confirmed = await ask("You have unsaved changes. Are you sure you want to start a new setup?", {
        title: "Confirm New Setup",
        kind: "warning",
      });

      if (!confirmed) {
        return;
      }
    }

    applySetup({ nodes: initialNodes, edges: [] }, null);
  }, [isDirty, applySetup]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "c") {
        if (isInput) {
          return;
        }

        const selectedNodes = nodesRef.current.filter((node) => node.selected);
        const clonableNodes = selectedNodes.filter((n) => n.type !== "serialInput" && n.type !== "serialOutput");

        if (clonableNodes.length > 0) {
          const clonableNodeIds = new Set(clonableNodes.map((n) => n.id));
          const selectedEdges = edgesRef.current.filter(
            (edge) => edge.selected && clonableNodeIds.has(edge.source) && clonableNodeIds.has(edge.target)
          );

          copyBufferRef.current = {
            nodes: clonableNodes,
            edges: selectedEdges,
          };
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "v") {
        if (isInput) {
          return;
        }

        if (copyBufferRef.current) {
          const idMap: { [oldId: string]: string } = {};
          const now = Date.now();

          const newNodes = copyBufferRef.current.nodes.map((node, index) => {
            const newId = `${node.type}-${now}-${index}-${Math.floor(Math.random() * 1000)}`;
            idMap[node.id] = newId;

            return {
              ...node,
              id: newId,
              position: {
                x: node.position.x + 40,
                y: node.position.y + 40,
              },
              selected: true,
            };
          });

          const newEdges = copyBufferRef.current.edges.map((edge, index) => {
            return {
              ...edge,
              id: `edge-${now}-${index}-${Math.floor(Math.random() * 1000)}`,
              source: idMap[edge.source],
              target: idMap[edge.target],
              selected: true,
            };
          });

          setNodes((nds) => nds.map((n) => ({ ...n, selected: false })).concat(newNodes));
          setEdges((eds) => eds.map((e) => ({ ...e, selected: false })).concat(newEdges));
          setIsDirty(true);
        }
      } else if (e.shiftKey && e.key.toLowerCase() === "a") {
        if (isInput) {
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

    const closeRequestedEvent = listen("close-requested", async () => {
      if (isDirtyRef.current) {
        const confirmExit = await ask("You have unsaved changes, are you sure you want to exit?", {
          title: "Unsaved Changes",
          kind: "warning"
        });

        if (confirmExit) {
          await getCurrentWindow().destroy();
        }
      } else {
        await getCurrentWindow().destroy();
      }
    });

    const saveRequestedEvent = listen("save-requested", onSave);
    const saveAsRequestedEvent = listen("save-as-requested", handleSaveAs);
    const openRequestedEvent = listen("open-requested", onOpen);
    const newRequestedEvent = listen("new-requested", onNew);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);

      closeRequestedEvent.then((f) => f());
      openRequestedEvent.then((f) => f());
      saveRequestedEvent.then((f) => f());
      saveAsRequestedEvent.then((f) => f());
      newRequestedEvent.then((f) => f());
    };
  }, [handleMouseMove, handleKeyDown, onSave, handleSaveAs, onOpen, onNew]);

  // Enrich nodes with data flow callbacks
  const enrichedNodes = useMemo(() => nodes.map((node) => ({
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
  })), [nodes, onData, registerConsumer, unregisterConsumer, onDeleteNode, updateNodeData, activePort, setActivePort]);

  const mapDeviceAgeToOpacity = (age: number) => {
    return (age < 10000) ? (
      1.0
    ) : (age < 15000) ? (
      0.75
    ) : (age < 20000) ? (
      0.5
    ) : (age < 25000) ? (
      0.25
    ) : (
      0.1
    );
  };

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
        selectionOnDrag={true}
        selectionMode={SelectionMode.Partial}
        selectionKeyCode="Shift"
        multiSelectionKeyCode="Shift"
        panOnDrag={[1, 2]}
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
        <button onClick={onNew}>New</button>
        <button onClick={onOpen}>Open</button>
        <button onClick={onSave}>Save</button>
        <button onClick={handleSaveAs}>Save As</button>
      </div>

      {(discoveredDevices.sensors.size > 0 || discoveredDevices.actuators.size > 0) && (
        <div className="discovered-devices">
          {(discoveredDevices.sensors.size > 0) && (
            <div className="discovered-devices-header">Sensors</div>
          )}

          {Array.from(discoveredDevices.sensors).map(([deviceName, [_, age]]) => {
            return (<div key={deviceName} style={{ opacity: mapDeviceAgeToOpacity(age) }}>{deviceName}</div>);
          })}

          {(discoveredDevices.actuators.size > 0) && (
            <div className="discovered-devices-header">Actuators</div>
          )}

          {Array.from(discoveredDevices.actuators).map(([deviceName, [_, age]]) => {
            return (<div key={deviceName} style={{ opacity: mapDeviceAgeToOpacity(age) }}>{deviceName}</div>);
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

      <div className="command-bar">
        {consoleData.command && AVAILABLE_COMMANDS[consoleData.command] && (
          <div className="console-hint">
            Params: {AVAILABLE_COMMANDS[consoleData.command]}
          </div>
        )}

        <input
          type="text"
          placeholder="Device"
          value={consoleData.device}
          onChange={(e) => setConsoleData((prev) => ({ ...prev, device: e.target.value }))}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        <input
          type="text"
          placeholder="Port"
          value={consoleData.port}
          onChange={(e) => setConsoleData((prev) => ({ ...prev, port: e.target.value }))}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        <select
          value={consoleData.command}
          onChange={(e) => setConsoleData((prev) => ({ ...prev, params: "", command: e.target.value }))}
        >
          <option value="">Select command...</option>
          {Object.keys(AVAILABLE_COMMANDS).map((cmd) => (
            <option key={cmd} value={cmd}>
              {cmd}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Params"
          value={consoleData.params}
          onChange={(e) => setConsoleData((prev) => ({ ...prev, params: e.target.value }))}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        <button disabled={!activePort || !consoleData.command} onClick={handleSendConsole}>
          Send
        </button>
      </div>
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
