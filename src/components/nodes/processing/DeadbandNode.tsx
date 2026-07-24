import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export function DeadbandNode({ data, id }: any) {
  const threshold = data.threshold ?? 5;
  const [lastValue, setLastValue] = useState<number | null>(null);
  const lastValueRef = useRef<number | null>(null);
  const outputRef = useRef<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastValue(lastValueRef.current);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {

        if (incoming && typeof incoming === "object" && typeof incoming.value === "number") {
          const value = incoming.value;

          if (outputRef.current === null || Math.abs(value - outputRef.current) >= threshold) {
            outputRef.current = value;
            lastValueRef.current = value;

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

      <div className="node-header" title={"Ignores small fluctuations in the signal within a specified threshold of the last value.\nInput: Numeric value\nOutput: Filtered value"}>
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
          onChange={(e) => data.updateNodeData?.(id, { threshold: Number(e.target.value) })}
          style={{ width: "100%" }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
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
