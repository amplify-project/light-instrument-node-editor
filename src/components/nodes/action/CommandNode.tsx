import { useState, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";

export function CommandNode({ data, id }: any) {
  const command = data.command || "led";
  const value = data.value || "";
  const [lastEmitted, setLastEmitted] = useState<any>(null);

  useEffect(() => {
    // Register this node to receive data
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {
        // Any incoming signal triggers the command emission
        if (incoming) {
          const payload = { command, value };
          setLastEmitted(payload);

          if (data.onData) {
            data.onData(id, payload);
          }
        }
      });
    }

    return () => {
      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [command, value, id, data]);

  const handleManualTrigger = () => {
    const payload = { command, value };
    setLastEmitted(payload);

    if (data.onData) {
      data.onData(id, payload);
    }
  };

  return (
    <div className="serial-node command-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <span>Command</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <label style={{ fontSize: "10px", color: "#888" }}>Command Name:</label>
        <input
          type="text"
          value={command}
          onChange={(e) => data.updateNodeData?.(id, { command: e.target.value })}
          placeholder="e.g. led"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        <label style={{ fontSize: "10px", color: "#888" }}>Value:</label>
        <input
          type="text"
          value={value}
          onChange={(e) => data.updateNodeData?.(id, { value: e.target.value })}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        <button onClick={handleManualTrigger}>Manual Trigger</button>

        {lastEmitted && (
          <div className="node-status">
            Last: {lastEmitted.command},{lastEmitted.value}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
