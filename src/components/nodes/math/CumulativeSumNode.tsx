import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export function CumulativeSumNode({ data, id }: any) {
  const bufferSize = data.bufferSize ?? 0;
  const [lastSum, setLastSum] = useState<number>(0);
  const valuesRef = useRef<number[]>([]);

  useEffect(() => {
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {

        if (incoming && typeof incoming === "object" && typeof incoming.value === "number") {
          const value = incoming.value;

          valuesRef.current.push(value);

          if (bufferSize > 0 && valuesRef.current.length > bufferSize) {
            valuesRef.current.shift();
          }

          const sum = valuesRef.current.reduce((a, b) => a + b, 0);

          setLastSum(sum);

          if (data.onData) {
            data.onData(id, { ...incoming, value: sum });
          }
        }
      });
    }

    return () => {

      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [bufferSize, id, data]);

  return (
    <div className="serial-node cumulative-sum-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header" title={"Sums incoming numeric values over an infinite or sliding window buffer.\nInput: Numeric value\nOutput: Current sum"}>
        <span>Cumulative Sum</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ fontSize: "10px", color: "#888" }}>Buffer Size (0=inf):</label>
          <span style={{ fontSize: "11px", color: "#eee" }}>{bufferSize}</span>
        </div>

        <input
          type="number"
          min="0"
          value={bufferSize}
          onChange={(e) => {
            const size = Math.max(0, Number(e.target.value));
            data.updateNodeData?.(id, { bufferSize: size });

            if (size > 0 && valuesRef.current.length > size) {
              valuesRef.current = valuesRef.current.slice(-size);
            }
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        <div className="node-status">
          Sum: {lastSum.toLocaleString()}
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
