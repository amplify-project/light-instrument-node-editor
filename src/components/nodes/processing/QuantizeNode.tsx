import { useState, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";

export function QuantizeNode({ data, id }: any) {
  const step = data.step ?? 10;
  const [lastValue, setLastValue] = useState<number | null>(null);

  useEffect(() => {
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {

        if (incoming && typeof incoming === "object" && typeof incoming.value === "number") {
          const value = incoming.value;
          const quantized = Math.round(value / step) * step;

          setLastValue(quantized);

          if (data.onData) {
            data.onData(id, { ...incoming, value: quantized });
          }
        }
      });
    }

    return () => {

      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [step, id, data]);

  return (
    <div className="serial-node quantize-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <span>Quantize</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ fontSize: "10px", color: "#888" }}>Step Size:</label>
          <span style={{ fontSize: "11px", color: "#eee" }}>{step}</span>
        </div>
        <input
          type="number"
          value={step}
          onChange={(e) => data.updateNodeData?.(id, { step: Number(e.target.value) })}
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
