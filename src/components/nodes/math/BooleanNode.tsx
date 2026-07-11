import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export function BooleanNode({ data, id }: any) {
  const operator = data.operator || "AND";
  const [valA, setValA] = useState<number>(0);
  const [valB, setValB] = useState<number>(0);
  const [lastOutput, setLastOutput] = useState<number | null>(null);

  const valARef = useRef(0);
  const valBRef = useRef(0);

  useEffect(() => {
    // Register this node to receive data
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any, handleId?: string | null) => {
        if (incoming && typeof incoming === "object" && typeof incoming.value === "number") {
          const truthy = incoming.value !== 0 ? 1 : 0;

          if (handleId === "b") {
            setValB(truthy);
            valBRef.current = truthy;
          } else {
            setValA(truthy);
            valARef.current = truthy;
          }

          const a = valARef.current === 1;
          const b = valBRef.current === 1;
          let result = 0;

          if (operator === "AND") {
            result = (a && b) ? 1 : 0;
          } else if (operator === "OR") {
            result = (a || b) ? 1 : 0;
          } else if (operator === "XOR") {
            result = (a !== b) ? 1 : 0;
          } else if (operator === "NOT") {
            result = (!a) ? 1 : 0;
          }

          setLastOutput(result);

          if (data.onData) {
            data.onData(id, { ...incoming, value: result });
          }
        }
      });
    }

    return () => {
      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [id, data, operator]);

  return (
    <div className="serial-node boolean-node">
      <Handle type="target" position={Position.Left} id="a" style={{ top: "30%" }} />
      <Handle type="target" position={Position.Left} id="b" style={{ top: "70%" }} />

      <div className="node-header" title={"Performs logical operations (AND, OR, XOR, NOT) on two boolean inputs (non-zero is true).\nInputs: A, B\nOutput: 1 or 0"}>
        <span>Boolean</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <label style={{ fontSize: "10px", color: "#888" }}>Operation:</label>
        <select
          value={operator}
          onChange={(e) => data.updateNodeData?.(id, { operator: e.target.value })}
        >
          <option value="AND">AND</option>
          <option value="OR">OR</option>
          <option value="XOR">XOR</option>
          <option value="NOT">NOT (Input A)</option>
        </select>

        <div style={{ fontSize: "10px", color: "#888", marginTop: "8px" }}>
          Input A: {valA ? "True" : "False"}
        </div>
        <div style={{ fontSize: "10px", color: "#888" }}>
          Input B: {valB ? "True" : "False"}
        </div>

        {lastOutput !== null && (
          <div className="node-status">
            Output: {lastOutput}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
