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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { save, open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

import { SerialInputNode } from "./components/nodes/SerialInputNode";
import { SerialOutputNode } from "./components/nodes/SerialOutputNode";
import { DeviceFilterNode } from "./components/nodes/DeviceFilterNode";
import { PeakDetectionNode } from "./components/nodes/PeakDetectionNode";
import { CommandNode } from "./components/nodes/CommandNode";
import { GraphNode } from "./components/nodes/GraphNode";
import { NodeSearch } from "./components/NodeSearch";
import "./App.css";

const nodeTypes = {
  serialInput: SerialInputNode,
  serialOutput: SerialOutputNode,
  deviceFilter: DeviceFilterNode,
  peakDetection: PeakDetectionNode,
  command: CommandNode,
  graph: GraphNode,
};

const initialNodes: Node[] = [
  {
    id: "input-1",
    type: "serialInput",
    position: { x: 100, y: 100 },
    data: { label: "Serial Input" },
  },
  {
    id: "output-1",
    type: "serialOutput",
    position: { x: 500, y: 100 },
    data: { label: "Serial Output" },
  },
  {
    id: "filter-1",
    type: "deviceFilter",
    position: { x: 300, y: 100 },
    data: { label: "Device Filter", filterValue: "sensor1" },
  },
];

const initialEdges: Edge[] = [];

function Flow() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.shiftKey && e.key.toLowerCase() === "a") {
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
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleMouseMove, handleKeyDown]);

  const onAddNode = useCallback((type: string) => {
    const position = screenToFlowPosition({
      x: searchState.x,
      y: searchState.y,
    });

    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: { label: type.charAt(0).toUpperCase() + type.slice(1) },
    };

    setNodes((nds) => nds.concat(newNode));
    setSearchState((prev) => ({ ...prev, visible: false }));
  }, [searchState, screenToFlowPosition]);

  // Ref to store consumers for output nodes
  const consumers = useRef<{ [id: string]: (data: any) => void }>({});

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onData = useCallback((sourceId: string, data: any) => {
    // Find edges connected to this source
    const connectedEdges = edges.filter((e) => e.source === sourceId);

    connectedEdges.forEach((edge) => {
      const consumer = consumers.current[edge.target];

      if (consumer) {
        consumer(data);
      }
    });
  }, [edges]);

  const registerConsumer = useCallback((id: string, consumer: (data: any) => void) => {
    consumers.current[id] = consumer;
  }, []);

  const unregisterConsumer = useCallback((id: string) => {
    delete consumers.current[id];
  }, []);

  const onDeleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  }, []);

  const onSave = useCallback(async () => {
    try {
      const path = await save({
        filters: [{ name: "JSON", extensions: ["json"] }],
        defaultPath: "node_setup.json",
      });

      if (path) {
        const setup = { nodes, edges };
        await invoke("save_file", { path, contents: JSON.stringify(setup, null, 2) });
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save: " + e);
    }
  }, [nodes, edges]);

  const onOpen = useCallback(async () => {
    try {
      const path = await open({
        filters: [{ name: "JSON", extensions: ["json"] }],
        multiple: false,
      });

      if (path) {
        const contents = await invoke<string>("load_file", { path });
        const setup = JSON.parse(contents);

        if (setup.nodes && setup.edges) {
          setNodes(setup.nodes);
          setEdges(setup.edges);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Failed to load: " + e);
    }
  }, []);

  // Enrich nodes with data flow callbacks
  const enrichedNodes = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onData,
      registerConsumer,
      unregisterConsumer,
      onDelete: onDeleteNode,
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
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#333" gap={20} />
        <Controls />
      </ReactFlow>

      <div className="file-controls">
        <button onClick={onOpen}>Open</button>
        <button onClick={onSave}>Save</button>
      </div>

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
