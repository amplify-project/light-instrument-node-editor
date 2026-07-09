import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export function MedianFilterNode({ data, id }: any) {
  const [windowSize, setWindowSize] = useState(data.windowSize ?? 5);
  const [lastMedian, setLastMedian] = useState<number | null>(null);
  const valuesRef = useRef<number[]>([]);

  useEffect(() => {
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {

        if (incoming && typeof incoming === "object" && typeof incoming.value === "number") {
          const value = incoming.value;

          valuesRef.current.push(value);

          if (valuesRef.current.length > windowSize) {
            valuesRef.current.shift();
          }

          const sorted = [...valuesRef.current].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

          setLastMedian(median);

          if (data.onData) {
            data.onData(id, { ...incoming, value: median });
          }
        }
      });
    }

    return () => {

      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [windowSize, id, data]);

  return (
    <div className="serial-node median-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <span>Median Filter</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ fontSize: "10px", color: "#888" }}>Window Size:</label>
          <span style={{ fontSize: "11px", color: "#eee" }}>{windowSize}</span>
        </div>
        <input
          type="range"
          min="1"
          max="50"
          step="1"
          value={windowSize}
          onChange={(e) => {
            const size = Number(e.target.value);
            setWindowSize(size);

            if (valuesRef.current.length > size) {
              valuesRef.current = valuesRef.current.slice(-size);
            }
          }}
          style={{ width: "100%" }}
        />

        {lastMedian !== null && (
          <div className="node-status">
            Med: {lastMedian.toFixed(2)}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
