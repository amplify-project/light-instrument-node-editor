import { useState, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";

const AVAILABLE_COMMANDS: Record<string, string> = {
  "set": "r,g,b,brightness",
  "setColor": "r,g,b",
  "setBrightness": "brightness",
  "setLED": "r,g,b,offset,numleds",
  "stop": "None",
  "rainbow": "deltaHue (optional)",
  "glitter": "r,g,b,duration",
  "pulse": "r,g,b,attack,decay,sustain,release",
  "comet": "r,g,b,speed",
  "breathe": "r,g,b,bpm",
  "fire": "r,g,b,intensity",
};

export function CommandNode({ data, id }: any) {
  const device = data.device || "";
  const port = data.port || "";
  const command = data.command || "";
  const value = data.value || "";
  const useInputAsParam = data.useInputAsParam || false;
  const [lastEmitted, setLastEmitted] = useState<any>(null);

  const hint = AVAILABLE_COMMANDS[command] || "";

  useEffect(() => {
    // Register this node to receive data
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {
        // Any incoming signal triggers the command emission
        if (incoming) {
          const payload = (useInputAsParam) ? (
            { device, port, command, value: incoming.value }
          ) : (
            { device, port, command, value }
          );

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
      setLastEmitted(payload);
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

      <div className="node-header" title={"Converts a trigger signal into a structured command packet for the serial output.\nInput: Any signal\nOutput: Command packet {device, port, command, value}"}>
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

        {(!useInputAsParam) && (
          <>
            <label style={{ fontSize: "10px", color: "#888" }}>Parameters:</label>
            <input
              type="text"
              value={value}
              disabled={useInputAsParam}
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
          </>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <input
            type="checkbox"
            id={`useinput-${id}`}
            checked={useInputAsParam}
            onChange={(e) => data.updateNodeData?.(id, { useInputAsParam: e.target.checked })}
            style={{ margin: 0 }}
          />
          <label htmlFor={`useinput-${id}`} style={{ fontSize: "11px", color: "#eee", cursor: "pointer" }}>
            Use input value
          </label>
        </div>

        <button disabled={useInputAsParam || command == ""} onClick={handleManualTrigger}>
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
