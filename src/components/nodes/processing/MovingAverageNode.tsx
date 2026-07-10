import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export function MovingAverageNode({ data, id }: any) {
  const windowSize = data.windowSize ?? 10;
  const [lastAverage, setLastAverage] = useState<number | null>(null);
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

          const sum = valuesRef.current.reduce((a, b) => a + b, 0);
          const average = sum / valuesRef.current.length;

          setLastAverage(average);

          if (data.onData) {
            data.onData(id, { ...incoming, value: average });
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
    <div className="serial-node moving-average-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <span>Moving Average</span>
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
          max="100"
          step="1"
          value={windowSize}
          onChange={(e) => {
            const size = Number(e.target.value);
            data.updateNodeData?.(id, { windowSize: size });

            if (valuesRef.current.length > size) {
              valuesRef.current = valuesRef.current.slice(-size);
            }
          }}
          style={{ width: "100%" }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        {lastAverage !== null && (
          <div className="node-status">
            Avg: {lastAverage.toFixed(2)}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
