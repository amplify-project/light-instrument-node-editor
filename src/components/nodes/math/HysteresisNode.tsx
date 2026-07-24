import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export function HysteresisNode({ data, id }: any) {
  const highThreshold = data.highThreshold ?? 800;
  const lowThreshold = data.lowThreshold ?? 200;
  const [state, setState] = useState(0);
  const stateRef = useRef<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setState(stateRef.current);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {

        if (incoming && typeof incoming === "object" && typeof incoming.value === "number") {
          const value = incoming.value;
          let nextState = stateRef.current;

          if (value >= highThreshold) {
            nextState = 1;
          } else if (value <= lowThreshold) {
            nextState = 0;
          }

          if (nextState !== stateRef.current) {
            stateRef.current = nextState;
          }

          if (data.onData) {
            data.onData(id, { ...incoming, value: nextState });
          }
        }
      });
    }

    return () => {

      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [highThreshold, lowThreshold, id, data]);

  return (
    <div className="serial-node hysteresis-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header" title={"Uses two thresholds to provide stable on/off switching and prevent jitter.\nInput: Numeric value\nOutput: 1 or 0"}>
        <span>Hysteresis</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <div>
          <label style={{ fontSize: "9px", color: "#888" }}>High</label>
          <input
            type="number"
            value={highThreshold}
            onChange={(e) => data.updateNodeData?.(id, { highThreshold: Number(e.target.value) })}
            style={{ width: "100%" }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>
        <div>
          <label style={{ fontSize: "9px", color: "#888" }}>Low</label>
          <input
            type="number"
            value={lowThreshold}
            onChange={(e) => data.updateNodeData?.(id, { lowThreshold: Number(e.target.value) })}
            style={{ width: "100%" }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>

        <div className="node-status" style={{ color: state ? "#46ff88" : "#888" }}>
          State: {state ? "ON (1)" : "OFF (0)"}
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
