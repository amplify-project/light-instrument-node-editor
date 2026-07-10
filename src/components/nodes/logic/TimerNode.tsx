import { useState, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";

export function TimerNode({ data, id }: any) {
  const interval = data.interval ?? 1000;
  const value = data.value ?? 1;
  const [lastTick, setLastTick] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setLastTick(now);

      if (data.onData) {
        data.onData(id, { device: "timer", port: "tick", value });
      }
    }, interval);

    return () => {
      clearInterval(timer);
    };
  }, [interval, value, id, data]);

  return (
    <div className="serial-node timer-node">
      <div className="node-header">
        <span>Timer</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ fontSize: "10px", color: "#888" }}>Interval (ms):</label>
          <span style={{ fontSize: "11px", color: "#eee" }}>{interval}</span>
        </div>

        <input
          type="number"
          min="10"
          value={interval}
          onChange={(e) => {
            const val = Math.max(10, Number(e.target.value));

            data.updateNodeData?.(id, { interval: val });
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
          <label style={{ fontSize: "10px", color: "#888" }}>Value:</label>
          <span style={{ fontSize: "11px", color: "#eee" }}>{value}</span>
        </div>

        <input
          type="number"
          value={value}
          onChange={(e) => {
            data.updateNodeData?.(id, { value: Number(e.target.value) });
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        <div className="node-status">
          Last tick: {lastTick > 0 ? new Date(lastTick).toLocaleTimeString() : "Never"}
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
