import { useState, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";

export function MapRangeNode({ data, id }: any) {
  const [inMin, setInMin] = useState(data.inMin ?? 0);
  const [inMax, setInMax] = useState(data.inMax ?? 1023);
  const [outMin, setOutMin] = useState(data.outMin ?? 0);
  const [outMax, setOutMax] = useState(data.outMax ?? 255);
  const [lastValue, setLastValue] = useState<number | null>(null);

  useEffect(() => {
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {

        if (incoming && typeof incoming === "object" && typeof incoming.value === "number") {
          const value = incoming.value;
          const mapped = ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

          setLastValue(mapped);

          if (data.onData) {
            data.onData(id, { ...incoming, value: mapped });
          }
        }
      });
    }

    return () => {

      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [inMin, inMax, outMin, outMax, id, data]);

  return (
    <div className="serial-node map-range-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <span>Map Range</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <div>
          <label style={{ fontSize: "9px", color: "#888" }}>In Min</label>
          <input type="number" value={inMin} onChange={(e) => setInMin(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div>
          <label style={{ fontSize: "9px", color: "#888" }}>In Max</label>
          <input type="number" value={inMax} onChange={(e) => setInMax(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div>
          <label style={{ fontSize: "9px", color: "#888" }}>Out Min</label>
          <input type="number" value={outMin} onChange={(e) => setOutMin(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div>
          <label style={{ fontSize: "9px", color: "#888" }}>Out Max</label>
          <input type="number" value={outMax} onChange={(e) => setOutMax(Number(e.target.value))} style={{ width: "100%" }} />
        </div>

        {lastValue !== null && (
          <div className="node-status">
            Out: {lastValue.toFixed(2)}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
