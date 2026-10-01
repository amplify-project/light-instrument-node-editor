import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export function DelayNode({ data, id }: any) {
  const delayMs = data.delayMs ?? 1000;
  const [isPending, setIsPending] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const pendingCountRef = useRef(0);
  const onDataRef = useRef(data.onData);
  const delayMsRef = useRef(delayMs);

  useEffect(() => {
    onDataRef.current = data.onData;
  }, [data.onData]);

  useEffect(() => {
    delayMsRef.current = delayMs;
  }, [delayMs]);

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
          const currentDelay = delayMsRef.current;
          pendingCountRef.current++;

          const timeout = setTimeout(() => {
            if (onDataRef.current) {
              onDataRef.current(id, incoming);
            }

            pendingCountRef.current--;
          }, currentDelay);

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
  }, [id, data.registerConsumer, data.unregisterConsumer]);

  return (
    <div className="node delay-node">
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
            {pendingCount} pending
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
