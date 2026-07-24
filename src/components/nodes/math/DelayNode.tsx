import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export function DelayNode({ data, id }: any) {
  const delayMs = data.delayMs ?? 1000;
  const [isPending, setIsPending] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const pendingCountRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsPending(pendingCountRef.current > 0);
      setPendingCount(pendingCountRef.current);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeouts: any[] = [];

    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {
        if (incoming) {
          pendingCountRef.current++;

          const timeout = setTimeout(() => {
            if (data.onData) {
              data.onData(id, incoming);
            }

            pendingCountRef.current--;
          }, delayMs);

          timeouts.push(timeout);
        }
      });
    }

    return () => {
      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }

      timeouts.forEach(clearTimeout);
    };
  }, [delayMs, id, data]);

  return (
    <div className="serial-node delay-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header" title={"Emits received events after a specified delay.\nInput: Any signal\nOutput: Delayed signal"}>
        <span>Delay</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <label style={{ fontSize: "10px", color: "#888" }}>Delay (ms):</label>
        <input
          type="number"
          value={delayMs}
          onChange={(e) => data.updateNodeData?.(id, { delayMs: Number(e.target.value) })}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        {isPending && (
          <div className="node-status">
            {pendingCount} pending...
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
