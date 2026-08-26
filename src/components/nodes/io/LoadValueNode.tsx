import { useState, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";
import { valueStore } from "../../../utils/valueStore";

export function LoadValueNode({ data, id }: any) {
  const [lastValue, setLastValue] = useState<any>(null);
  const name = data.name ?? "";

  useEffect(() => {
    if (!name) return;

    const unsubscribe = valueStore.subscribe(name, (value) => {
      setLastValue(value);

      if (data.onData) {
        data.onData(id, value);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [name, id, data]);

  const displayValue = lastValue !== null
    ? (typeof lastValue === "object"
        ? JSON.stringify(lastValue)
        : String(lastValue))
    : "";

  const truncatedValue = displayValue.length > 30
    ? displayValue.substring(0, 27) + "..."
    : displayValue;

  return (
    <div className="node input-node load-value-node">
      <div className="node-header" title={"Emits the message whenever a new value is stored under a matching name.\nInput: None\nOutput: Shared message"}>
        <span>Load Value</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <label style={{ fontSize: "10px", color: "#888" }}>Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => data.updateNodeData(id, { name: e.target.value })}
          placeholder="Value name..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        {lastValue !== null && (
          <div className="node-status">
            {truncatedValue}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
