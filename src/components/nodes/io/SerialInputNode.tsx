import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface SerialDataPayload {
  port: string;
  data: string;
}

export function SerialInputNode({ data, id }: any) {
  const [ports, setPorts] = useState<string[]>([]);
  const [selectedPort, setSelectedPort] = useState("");
  const [baudRate, setBaudRate] = useState(115200);
  const [isConnected, setIsConnected] = useState(false);
  const [lastParsed, setLastParsed] = useState<any>(null);

  const bufferRef = useRef("");

  useEffect(() => {
    refreshPorts();

    const unlistenData = listen<SerialDataPayload>("serial-data", (event) => {
      const isCorrectPort = event.payload.port === selectedPort && isConnected;

      if (isCorrectPort) {
        bufferRef.current += event.payload.data;

        // Split by newlines and handle partial lines
        const lines = bufferRef.current.split(/\r?\n/);
        bufferRef.current = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();

          if (!trimmed) continue;

          // Parse "device,port,value"
          const parts = trimmed.split(",");

          if (parts.length === 3) {
            const [device, port, valueStr] = parts;
            const value = parseInt(valueStr, 10);

            if (!isNaN(value)) {
              const parsed = { device, port, value };
              setLastParsed(parsed);

              if (data.onData) {
                data.onData(id, parsed);
              }
            }
          }
        }
      }
    });

    return () => {
      unlistenData.then((f) => f());
    };
  }, [selectedPort, isConnected, id, data]);

  const refreshPorts = async () => {
    const availablePorts = await invoke<string[]>("list_ports");
    setPorts(availablePorts);

    if (availablePorts.length > 0 && !selectedPort) {
      setSelectedPort(availablePorts[0]);
    }
  };

  const toggleConnect = async () => {
    if (isConnected) {
      await invoke("close_port", { portName: selectedPort });
      setIsConnected(false);

      if (data.setActivePort) {
        data.setActivePort(null);
      }
    } else {
      try {
        await invoke("open_port", { portName: selectedPort, baudRate });
        setIsConnected(true);

        if (data.setActivePort) {
          data.setActivePort(selectedPort);
        }
      } catch (e) {
        alert("Failed to open port: " + e);
      }
    }
  };

  return (
    <div className="serial-node input-node">
      <div className="node-header">
        <span>Serial Input</span>
      </div>

      <div className="node-content nodrag">
        <select
          value={selectedPort}
          onChange={(e) => setSelectedPort(e.target.value)}
          disabled={isConnected}
        >
          {ports.map((port) => (
            <option key={port} value={port}>{port}</option>
          ))}
        </select>

        <input
          type="number"
          value={baudRate}
          onChange={(e) => setBaudRate(Number(e.target.value))}
          disabled={isConnected}
        />

        <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
          <button
            onClick={toggleConnect}
            style={{ flex: 1 }}
          >
            {isConnected ? "Disconnect" : "Connect"}
          </button>
        </div>

        <button
          onClick={refreshPorts}
          disabled={isConnected}
          style={{ width: "100%", marginTop: "4px" }}
        >
          Refresh Ports
        </button>

        {lastParsed && (
          <div className="node-status">
            Last: {lastParsed.device}:{lastParsed.value}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
