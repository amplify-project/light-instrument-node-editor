import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export function DeadbandNode({ data, id }: any) {
  const [threshold, setThreshold] = useState(data.threshold ?? 5);
  const [lastValue, setLastValue] = useState<number | null>(null);
  const outputRef = useRef<number | null>(null);

  useEffect(() => {
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {

        if (incoming && typeof incoming === "object" && typeof incoming.value === "number") {
          const value = incoming.value;

          if (outputRef.current === null || Math.abs(value - outputRef.current) >= threshold) {
            outputRef.current = value;
            setLastValue(value);

            if (data.onData) {
              data.onData(id, { ...incoming, value });
            }
          }
        }
      });
    }

    return () => {

      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [threshold, id, data]);

  return (
    <div className="serial-node deadband-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <span>Deadband</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ fontSize: "10px", color: "#888" }}>Threshold:</label>
          <span style={{ fontSize: "11px", color: "#eee" }}>{threshold}</span>
        </div>
        <input
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          style={{ width: "100%" }}
        />

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
