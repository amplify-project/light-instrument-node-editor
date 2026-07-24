import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";

interface SerialDataPayload {
  port: string;
  data: string;
}

export function SimulateNode({ data, id }: any) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastParsed, setLastParsed] = useState<any>(null);
  const bufferRef = useRef("");

  useEffect(() => {
    const unlistenData = listen<SerialDataPayload>("serial-data", (event) => {
      if (event.payload.port === "SIMULATION" && isSimulating) {
        bufferRef.current += event.payload.data;

        const lines = bufferRef.current.split(/\r?\n/);
        bufferRef.current = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();

          if (!trimmed) continue;

          const parts = trimmed.split(",");

          if (parts.length === 4) {
            const [_, device, port, valueStr] = parts;
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

    const unlistenFinished = listen("simulation-finished", () => {
      setIsSimulating(false);
    });

    return () => {
      unlistenData.then((f) => f());
      unlistenFinished.then((f) => f());
    };
  }, [isSimulating, id, data]);

  const handleSimulate = async () => {
    if (isSimulating) {
      await invoke("stop_simulation");
      setIsSimulating(false);
    } else {
      try {
        const filePath = await open({
          filters: [{ name: "Text", extensions: ["txt", "csv", "log"] }],
        });

        if (filePath) {
          setIsSimulating(true);
          await invoke("start_simulation", { path: filePath });
        }
      } catch (e) {
        alert("Failed to start simulation: " + e);
        setIsSimulating(false);
      }
    }
  };

  return (
    <div className="serial-node simulate-node">
      <div className="node-header" title={"Reads recorded sensor data from a file and streams it into the editor.\nOutput: Structured packet {device, port, value}"}>
        <span>Simulate</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <button
          onClick={handleSimulate}
          style={{ width: "100%", marginBottom: "8px" }}
        >
          {isSimulating ? "Stop Simulation" : "Load & Start"}
        </button>

        {lastParsed && (
          <div className="node-status">
            Last: {lastParsed.device}:{lastParsed.value}
          </div>
        )}

        {!lastParsed && (
          <div className="node-status" style={{ color: "#888" }}>
            {isSimulating ? "Streaming..." : "No data"}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
