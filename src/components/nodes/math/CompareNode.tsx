import { useState, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";

export function CompareNode({ data, id }: any) {
  const compareValue = data.compareValue ?? 0;
  const operator = data.operator || "==";
  const [lastMet, setLastMet] = useState<any>(null);

  useEffect(() => {
    // Register this node to receive data
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {
        if (incoming && typeof incoming === "object" && typeof incoming.value === "number") {
          const value = incoming.value;
          let met = false;

          if (operator === "==") {
            met = value === compareValue;
          } else if (operator === "!=") {
            met = value !== compareValue;
          } else if (operator === ">") {
            met = value > compareValue;
          } else if (operator === "<") {
            met = value < compareValue;
          } else if (operator === ">=") {
            met = value >= compareValue;
          } else if (operator === "<=") {
            met = value <= compareValue;
          }

          if (met) {
            setLastMet(incoming);

            if (data.onData) {
              data.onData(id, incoming);
            }
          }
        }
      });
    }

    return () => {
      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [compareValue, operator, id, data]);

  return (
    <div className="serial-node compare-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header" title={"Compares input data against a threshold using mathematical operators.\nInput: Numeric value\nOutput: Filtered numeric value"}>
        <span>Compare</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <label style={{ fontSize: "10px", color: "#888" }}>Operator:</label>
        <select
          value={operator}
          onChange={(e) => data.updateNodeData?.(id, { operator: e.target.value })}
        >
          <option value="==">Equal (==)</option>
          <option value="!=">Not Equal (!=)</option>
          <option value=">">Greater Than (&gt;)</option>
          <option value="<">Smaller Than (&lt;)</option>
          <option value=">=">Greater Equal (&gt;=)</option>
          <option value="<=">Smaller Equal (&lt;=)</option>
        </select>

        <label style={{ fontSize: "10px", color: "#888" }}>Value:</label>
        <input
          type="number"
          value={compareValue}
          onChange={(e) => data.updateNodeData?.(id, { compareValue: Number(e.target.value) })}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        {lastMet && (
          <div className="node-status">
            Last Met: {lastMet.value}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
