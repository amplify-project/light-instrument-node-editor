import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import { valueStore } from "../../../utils/valueStore";

export function StoreValueNode({ data, id }: any) {
  const [lastValue, setLastValue] = useState<any>(null);
  const lastValueRef = useRef<any>(null);
  const name = data.name ?? "";

  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (lastValueRef.current !== lastValue) {
        setLastValue(lastValueRef.current);
      }
    }, 100);

    return () => clearInterval(syncInterval);
  }, [lastValue]);

  useEffect(() => {
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {
        if (name) {
          lastValueRef.current = incoming;
          valueStore.store(name, incoming);
        }
      });
    }

    return () => {
      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [name, id, data]);

  const displayValue = name && lastValue !== null
    ? (typeof lastValue === "object"
        ? JSON.stringify(lastValue)
        : String(lastValue))
    : "";

  const truncatedValue = displayValue.length > 30
    ? displayValue.substring(0, 27) + "..."
    : displayValue;

  return (
    <div className="node output-node store-value-node">
      <Handle type="target" position={Position.Left} className="multi-handle" />

      <div className="node-header" title={"Stores incoming messages under a user-defined name.\nInput: Any message\nOutput: None"}>
        <span>Store Value</span>
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

        {name && lastValue !== null && (
          <div className="node-status">
            {truncatedValue}
          </div>
        )}
      </div>
    </div>
  );
}
