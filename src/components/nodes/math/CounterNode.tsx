import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export function CounterNode({ data, id }: any) {
  const [count, setCount] = useState<number>(0);
  const countRef = useRef<number>(0);

  useEffect(() => {
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {
        countRef.current += 1;
        setCount(countRef.current);

        if (data.onData) {
          data.onData(id, {
            ...incoming,
            device: "counter",
            port: "out",
            value: countRef.current,
          });
        }
      });
    }

    return () => {
      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [id, data]);

  const onReset = () => {
    countRef.current = 0;
    setCount(0);
  };

  return (
    <div className="serial-node counter-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <span>Counter</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <div className="node-status">
          Count: {count.toLocaleString()}
        </div>

        <button
          onClick={onReset}
          style={{
            marginTop: "8px",
            width: "100%",
            fontSize: "10px",
            padding: "4px",
            background: "#444",
            color: "#eee",
            border: "1px solid #666",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Reset
        </button>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
