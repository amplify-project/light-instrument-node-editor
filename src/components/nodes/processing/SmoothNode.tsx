import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export function SmoothNode({ data, id }: any) {
  const alpha = data.alpha ?? 0.5;
  const [lastSmoothed, setLastSmoothed] = useState<number | null>(null);
  const lastSmoothedRef = useRef<number | null>(null);
  const smoothedRef = useRef<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastSmoothed(lastSmoothedRef.current);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Register this node to receive data
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {

        if (incoming && typeof incoming === "object" && typeof incoming.value === "number") {
          const value = incoming.value;
          let nextSmoothed: number;

          if (smoothedRef.current === null) {
            nextSmoothed = value;
          } else {
            nextSmoothed = alpha * value + (1 - alpha) * smoothedRef.current;
          }

          smoothedRef.current = nextSmoothed;
          lastSmoothedRef.current = nextSmoothed;

          if (data.onData) {
            data.onData(id, { ...incoming, value: nextSmoothed });
          }
        }
      });
    }

    return () => {

      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [alpha, id, data]);

  return (
    <div className="serial-node smooth-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header" title={"Applies exponential smoothing to the data stream to reduce jitter.\nInput: Numeric value\nOutput: Smoothed value"}>
        <span>Smooth</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ fontSize: "10px", color: "#888" }}>Factor (Alpha):</label>
          <span style={{ fontSize: "11px", color: "#eee" }}>{alpha.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0.01"
          max="1"
          step="0.01"
          value={alpha}
          onChange={(e) => data.updateNodeData?.(id, { alpha: Number(e.target.value) })}
          style={{ width: "100%" }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        {lastSmoothed !== null && (
          <div className="node-status">
            Smoothed: {lastSmoothed.toFixed(2)}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
