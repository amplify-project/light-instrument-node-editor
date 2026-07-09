import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export function ToggleNode({ data, id }: any) {
  const [state, setState] = useState(0);
  const stateRef = useRef<number>(0);
  const lastInputRef = useRef<boolean>(false);

  useEffect(() => {
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {

        if (incoming && typeof incoming === "object" && typeof incoming.value === "number") {
          const isTrue = incoming.value !== 0;

          // Detect rising edge (transition from false to true)
          if (isTrue && !lastInputRef.current) {
            const nextState = stateRef.current === 0 ? 1 : 0;
            stateRef.current = nextState;
            setState(nextState);

            if (data.onData) {
              data.onData(id, { ...incoming, value: nextState });
            }
          }

          lastInputRef.current = isTrue;
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
    <div className="serial-node toggle-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <span>Toggle</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <div className="node-status" style={{ color: state ? "#46ff88" : "#888", textAlign: "center" }}>
          {state ? "ON (1)" : "OFF (0)"}
        </div>
        <div style={{ fontSize: "9px", color: "#666", textAlign: "center" }}>
          Toggles on rising edge
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
