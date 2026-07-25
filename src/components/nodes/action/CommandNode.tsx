import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import { AVAILABLE_COMMANDS } from "../../../constants";

export function CommandNode({ data, id }: any) {
  const device = data.device || "";
  const port = data.port || "";
  const command = data.command || "";
  const value = data.value || "";
  const [lastEmitted, setLastEmitted] = useState<any>(null);
  const lastEmittedRef = useRef<any>(null);

  const hint = AVAILABLE_COMMANDS[command] || "";

  useEffect(() => {
    const interval = setInterval(() => {
      setLastEmitted(lastEmittedRef.current);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Register this node to receive data
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {
        // Any incoming signal triggers the command emission
        if (incoming) {
          const finalValue = String(value).replace(/#/g, incoming.value);
          const payload = { device, port, command, value: finalValue };

          emitPayload(payload);
        }
      });
    }

    return () => {
      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [device, port, command, value, id, data]);

  const emitPayload = (payload: { device: string, port: string, command: string, value: string}) => {
    if (command == "") {
      return;
    }

    if (data.onData) {
      lastEmittedRef.current = payload;
      data.onData(id, payload);
    }
  };

  const handleManualTrigger = () => {
    const payload = { device, port, command, value };
    emitPayload(payload);
  };

  return (
    <div className="serial-node command-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header" title={"Converts a trigger signal into a structured command packet for the serial output.\nInput: Any signal\nOutput: Command packet {device, port, command, value}\nUse '#' in parameters to inject incoming value."}>
        <span>Command</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <label style={{ fontSize: "10px", color: "#888" }}>Device:</label>
        <input
          type="text"
          value={device}
          onChange={(e) => data.updateNodeData?.(id, { device: e.target.value })}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        <label style={{ fontSize: "10px", color: "#888" }}>Port:</label>
        <input
          type="text"
          value={port}
          onChange={(e) => data.updateNodeData?.(id, { port: e.target.value })}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        <label style={{ fontSize: "10px", color: "#888" }}>Command Name:</label>
        <select
          value={command}
          onChange={(e) => data.updateNodeData?.(id, { command: e.target.value })}
        >
          <option value="">Select a command...</option>
          {Object.keys(AVAILABLE_COMMANDS ).map((cmd) => (
            <option key={cmd} value={cmd}>
              {cmd === "" ? "Select a command..." : cmd}
            </option>
          ))}
        </select>

        <label style={{ fontSize: "10px", color: "#888" }}>Parameters:</label>
        <input
          type="text"
          value={value}
          onChange={(e) => data.updateNodeData?.(id, { value: e.target.value })}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        {hint && (
          <div style={{ fontSize: "9px", color: "#666", marginTop: "-6px", marginBottom: "4px" }}>
            Params: {hint}
          </div>
        )}

        <button disabled={command == ""} onClick={handleManualTrigger}>
          Manual Trigger
        </button>

        {lastEmitted && (
          <div className="node-status">
            Last: {lastEmitted.device},{lastEmitted.port},{lastEmitted.command},{lastEmitted.value}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
