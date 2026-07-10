import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export function RateNode({ data, id }: any) {
  const interval = data.interval ?? 1000;
  const [currentRate, setCurrentRate] = useState<number>(0);
  const countRef = useRef<number>(0);

  useEffect(() => {
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {
        if (incoming) {
          countRef.current++;
        }
      });
    }

    const timer = setInterval(() => {
      const rate = countRef.current;

      countRef.current = 0;
      setCurrentRate(rate);

      if (data.onData) {
        data.onData(id, { device: "rate", port: "msgs", value: rate });
      }
    }, interval);

    return () => {
      clearInterval(timer);

      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [interval, id, data]);

  return (
    <div className="serial-node rate-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <span>Rate</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ fontSize: "10px", color: "#888" }}>Interval (ms):</label>
          <span style={{ fontSize: "11px", color: "#eee" }}>{interval}</span>
        </div>

        <input
          type="number"
          min="100"
          step="100"
          value={interval}
          onChange={(e) => {
            const val = Math.max(100, Number(e.target.value));

            data.updateNodeData?.(id, { interval: val });
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        <div className="node-status">
          Rate: {currentRate} msg/int
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
