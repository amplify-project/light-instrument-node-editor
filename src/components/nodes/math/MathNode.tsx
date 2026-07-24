import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export function MathNode({ data, id }: any) {
  const operator = data.operator || "+";
  const [valA, setValA] = useState<number>(0);
  const [valB, setValB] = useState<number>(0);
  const [lastOutput, setLastOutput] = useState<number | null>(null);

  const valARef = useRef(0);
  const valBRef = useRef(0);
  const lastOutputRef = useRef<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setValA(valARef.current);
      setValB(valBRef.current);
      setLastOutput(lastOutputRef.current);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Register this node to receive data
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any, handleId?: string | null) => {
        if (incoming && typeof incoming === "object" && typeof incoming.value === "number") {
          const value = incoming.value;

          if (handleId === "b") {
            valBRef.current = value;
          } else {
            valARef.current = value;
          }

          const a = valARef.current;
          const b = valBRef.current;
          let result = 0;

          if (operator === "+") {
            result = a + b;
          } else if (operator === "-") {
            result = a - b;
          } else if (operator === "*") {
            result = a * b;
          } else if (operator === "/") {
            result = b !== 0 ? a / b : 0;
          } else if (operator === "%") {
            result = b !== 0 ? a % b : 0;
          }

          lastOutputRef.current = result;

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
    <div className="serial-node math-node">
      <Handle type="target" position={Position.Left} id="a" style={{ top: 113 }} />
      <Handle type="target" position={Position.Left} id="b" style={{ top: 134 }} />

      <div className="node-header" title={"Performs arithmetic operations (+, -, *, /, %) on two numeric inputs.\nInputs: A, B\nOutput: Calculation result"}>
        <span>Math</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <label style={{ fontSize: "10px", color: "#888" }}>Operation:</label>
        <select
          value={operator}
          onChange={(e) => data.updateNodeData?.(id, { operator: e.target.value })}
        >
          <option value="+">Add (+)</option>
          <option value="-">Subtract (-)</option>
          <option value="*">Multiply (*)</option>
          <option value="/">Divide (/)</option>
          <option value="%">Modulo (%)</option>
        </select>

        <div style={{ fontSize: "10px", color: "#888", marginTop: "8px" }}>
          Input A: {valA}
        </div>
        <div style={{ fontSize: "10px", color: "#888" }}>
          Input B: {valB}
        </div>

        {lastOutput !== null && (
          <div className="node-status">
            Result: {lastOutput}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
