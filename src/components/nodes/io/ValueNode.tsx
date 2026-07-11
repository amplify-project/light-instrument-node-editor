import { Handle, Position } from "@xyflow/react";
import React from "react";

export function ValueNode({ data, id }: any) {
  const value = data.value ?? 0;

  const emitValue = (val: number) => {
    if (data.onData) {
      data.onData(id, {
        device: "value",
        port: "out",
        value: val,
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = Number(e.target.value);

    data.updateNodeData?.(id, { value: newVal });
    emitValue(newVal);
  };

  return (
    <div className="serial-node value-node">
      <div className="node-header">
        <span>Value</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <label style={{ fontSize: "10px", color: "#888" }}>Value:</label>
        <input
          type="number"
          value={value}
          onChange={handleChange}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          style={{
            width: "100%",
            boxSizing: "border-box",
          }}
        />

        <button
          onClick={() => emitValue(value)}
          style={{
            width: "100%",
            marginTop: "8px",
            fontSize: "10px",
            padding: "4px",
            cursor: "pointer",
          }}
        >
          Push Value
        </button>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
