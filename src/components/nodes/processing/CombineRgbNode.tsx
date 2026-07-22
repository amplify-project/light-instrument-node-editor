import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export function CombineRgbNode({ data, id }: any) {
  const [r, setR] = useState<number>(0);
  const [g, setG] = useState<number>(0);
  const [b, setB] = useState<number>(0);

  const rRef = useRef(0);
  const gRef = useRef(0);
  const bRef = useRef(0);

  useEffect(() => {
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any, handleId?: string | null) => {
        if (incoming && typeof incoming === "object") {
          const value = typeof incoming.value === "number" ? incoming.value : 0;

          if (handleId === "r") {
            setR(value);
            rRef.current = value;
          } else if (handleId === "g") {
            setG(value);
            gRef.current = value;
          } else if (handleId === "b") {
            setB(value);
            bRef.current = value;
          }

          if (data.onData) {
            data.onData(id, {
              ...incoming,
              device: "combine",
              port: "rgb",
              value: `${rRef.current},${gRef.current},${bRef.current}`
            });
          }
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
    <div className="serial-node combine-rgb-node">
      <Handle
        type="target"
        position={Position.Left}
        id="r"
        style={{ top: 60 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="g"
        style={{ top: 80 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="b"
        style={{ top: 100 }}
      />

      <div
        className="node-header"
        title={"Combines three numeric inputs into a CSV string format 'r,g,b'.\nInputs: R, G, B\nOutput: String 'r,g,b'"}
      >
        <span>Combine RGB</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <div style={{ fontSize: "10px", color: "#888" }}>
          R: {r}
        </div>
        <div style={{ fontSize: "10px", color: "#888" }}>
          G: {g}
        </div>
        <div style={{ fontSize: "10px", color: "#888" }}>
          B: {b}
        </div>

        <div className="node-status">
          Value: {r},{g},{b}
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
