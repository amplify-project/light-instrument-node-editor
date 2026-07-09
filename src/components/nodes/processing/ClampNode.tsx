import { useState, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";

export function ClampNode({ data, id }: any) {
  const min = data.min ?? 0;
  const max = data.max ?? 1023;
  const [lastValue, setLastValue] = useState<number | null>(null);

  useEffect(() => {
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {

        if (incoming && typeof incoming === "object" && typeof incoming.value === "number") {
          const value = incoming.value;
          const clamped = Math.min(Math.max(value, min), max);

          setLastValue(clamped);

          if (data.onData) {
            data.onData(id, { ...incoming, value: clamped });
          }
        }
      });
    }

    return () => {

      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [min, max, id, data]);

  return (
    <div className="serial-node clamp-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <span>Clamp</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <div>
          <label style={{ fontSize: "9px", color: "#888" }}>Min</label>
          <input type="number" value={min} onChange={(e) => data.updateNodeData?.(id, { min: Number(e.target.value) })} style={{ width: "100%" }} />
        </div>
        <div>
          <label style={{ fontSize: "9px", color: "#888" }}>Max</label>
          <input type="number" value={max} onChange={(e) => data.updateNodeData?.(id, { max: Number(e.target.value) })} style={{ width: "100%" }} />
        </div>

        {lastValue !== null && (
          <div className="node-status">
            Out: {lastValue}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
