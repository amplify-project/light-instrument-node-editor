import { useState, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";

export function CommandNode({ data, id }: any) {
  const device = data.device || "";
  const port = data.port || "";
  const command = data.command || "";
  const value = data.value || "";
  const useInputAsParam = data.useInputAsParam || false;
  const [lastEmitted, setLastEmitted] = useState<any>(null);

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
    if (Object.entries(payload).some(([key, val]) => key != "value" && val == "")) {
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

      <div className="node-header">
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
        <input
          type="text"
          value={command}
          onChange={(e) => data.updateNodeData?.(id, { command: e.target.value })}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

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

        <button disabled={useInputAsParam} onClick={handleManualTrigger}>Manual Trigger</button>

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
