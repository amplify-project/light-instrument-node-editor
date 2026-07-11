import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export function DerivativeNode({ data, id }: any) {
  const [lastDiff, setLastDiff] = useState<number | null>(null);
  const lastValueRef = useRef<number | null>(null);

  useEffect(() => {
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {

        if (incoming && typeof incoming === "object" && typeof incoming.value === "number") {
          const value = incoming.value;

          if (lastValueRef.current !== null) {
            const diff = value - lastValueRef.current;
            setLastDiff(diff);

            if (data.onData) {
              data.onData(id, { ...incoming, value: diff });
            }
          }

          lastValueRef.current = value;
        }
      });
    }

    return () => {

      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [id, data]);

  return (
    <div className="serial-node derivative-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header" title={"Calculates the rate of change (velocity) of the incoming signal.\nInput: Numeric value\nOutput: Delta value"}>
        <span>Derivative</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <div style={{ fontSize: "10px", color: "#888", marginBottom: "4px" }}>
          Rate of Change (Δ)
        </div>

        {lastDiff !== null && (
          <div className="node-status">
            Diff: {lastDiff}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
