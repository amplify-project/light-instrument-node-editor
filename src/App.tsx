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

import { SerialInputNode } from "./components/nodes/SerialInputNode";
import { SerialOutputNode } from "./components/nodes/SerialOutputNode";
import { DeviceFilterNode } from "./components/nodes/DeviceFilterNode";
import { PeakDetectionNode } from "./components/nodes/PeakDetectionNode";
import { CommandNode } from "./components/nodes/CommandNode";
import { GraphNode } from "./components/nodes/GraphNode";
import { CompareNode } from "./components/nodes/CompareNode";
import { BooleanNode } from "./components/nodes/BooleanNode";
import { NodeSearch } from "./components/NodeSearch";
import "./App.css";

const nodeTypes = {
  serialInput: SerialInputNode,
  serialOutput: SerialOutputNode,
  deviceFilter: DeviceFilterNode,
  peakDetection: PeakDetectionNode,
  command: CommandNode,
  graph: GraphNode,
  compare: CompareNode,
  boolean: BooleanNode,
};

const initialNodes: Node[] = [
  {
    id: "input-1",
    type: "serialInput",
    position: { x: 100, y: 100 },
    data: { label: "Serial Input" },
    deletable: false,
  },
  {
    id: "output-1",
    type: "serialOutput",
    position: { x: 500, y: 100 },
    data: { label: "Serial Output" },
    deletable: false,
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
    };

    setNodes((nds) => nds.concat(newNode));
    setSearchState((prev) => ({ ...prev, visible: false }));
  }, [searchState, screenToFlowPosition]);

  // Ref to store consumers for output nodes
  const consumers = useRef<{ [id: string]: (data: any, handleId?: string | null) => void }>({});

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (targetNode && targetNode.type === "serialOutput") {
        return true;
      }

      // For all other nodes, only allow one connection per input handle
      const existingEdge = edges.find(
        (edge) => edge.target === connection.target && edge.targetHandle === connection.targetHandle
      );

      if (existingEdge && (connection as any).id === existingEdge.id) {
        return true;
      }

      return !existingEdge;
    },
    [nodes, edges]
  );

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

  const onDeleteNode = useCallback((id: string) => {
    setNodes((nds) => {
      const node = nds.find((n) => n.id === id);

      if (node && (node.type === "serialInput" || node.type === "serialOutput")) {
        return nds;
      }

      return nds.filter((n) => n.id !== id);
    });

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
        isValidConnection={isValidConnection}
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
