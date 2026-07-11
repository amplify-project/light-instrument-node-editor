import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export function EdgeTriggerNode({ data, id }: any) {
  const mode = data.mode ?? "rising";
  const threshold = data.threshold ?? 0;
  const [triggerCount, setTriggerCount] = useState(0);
  const lastValueRef = useRef<number | null>(null);

  useEffect(() => {
    // Register this node to receive data
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {
        if (incoming && typeof incoming === "object" && typeof incoming.value === "number") {
          const currentVal = incoming.value;
          const prevVal = lastValueRef.current;

          if (prevVal !== null) {
            let triggered = false;

            if (mode === "rising") {
              if (prevVal <= threshold && currentVal > threshold) {
                triggered = true;
              }
            } else if (mode === "falling") {
              if (prevVal > threshold && currentVal <= threshold) {
                triggered = true;
              }
            }

            if (triggered) {
              setTriggerCount((c) => c + 1);

              if (data.onData) {
                data.onData(id, { ...incoming, value: 1 });
              }
            }
          }

          lastValueRef.current = currentVal;
        }
      });
    }

    return () => {
      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [id, data, mode, threshold]);

  return (
    <div className="serial-node edge-trigger-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header" title={"Detects rising or falling transitions in a signal and emits a single impulse.\nInput: Numeric signal\nOutput: Impulse (1)"}>
        <span>Edge Trigger</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <label style={{ fontSize: "10px", color: "#888" }}>Mode:</label>
        <select value={mode} onChange={(e) => data.updateNodeData?.(id, { mode: e.target.value })}>
          <option value="rising">Rising Edge</option>
          <option value="falling">Falling Edge</option>
        </select>

        <div style={{ marginTop: "4px" }}>
          <label style={{ fontSize: "10px", color: "#888" }}>Threshold:</label>
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
        </div>

        <div className="node-status" style={{ marginTop: "8px" }}>
          Triggers: {triggerCount}
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
