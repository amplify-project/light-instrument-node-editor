import { useState, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";

const MAX_DATA_POINTS = 50;

export function GraphNode({ data, id }: any) {
  const [points, setPoints] = useState<number[]>([]);

  useEffect(() => {
    // Register this node to receive data
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {
        if (incoming && typeof incoming === "object" && typeof incoming.value === "number") {
          setPoints((prev) => {
            const next = [...prev, incoming.value];

            if (next.length > MAX_DATA_POINTS) {
              return next.slice(next.length - MAX_DATA_POINTS);
            }

            return next;
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

  // SVG constants
  const width = 216;
  const height = 80;
  const padding = 5;

  const minVal = points.length > 0 ? Math.min(...points) : 0;
  const maxVal = points.length > 0 ? Math.max(...points) : 100;
  const range = Math.max(maxVal - minVal, 1);

  // Map points to SVG coordinates
  const getX = (index: number) => {
    const totalPoints = points.length > 1 ? points.length : MAX_DATA_POINTS;
    return (index / (totalPoints - 1)) * (width - 2 * padding) + padding;
  };
  const getY = (val: number) => height - ((val - minVal) / range) * (height - 2 * padding) - padding;

  const pathData = points.length > 1
    ? points.map((val, i) => `${getX(i)},${getY(val)}`).join(" L ")
    : "";

  return (
    <div className="serial-node graph-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header" title={"Visualizes incoming numeric data on a real-time line chart.\nInput: Numeric value"}>
        <span>Graph</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <div style={{ background: "#121212", borderRadius: "4px", overflow: "hidden", border: "1px solid #333" }}>
          <svg width={width} height={height} style={{ display: "block" }}>
            {points.length > 1 && (
              <path
                d={`M ${pathData}`}
                fill="none"
                stroke="#46ccff"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </div>

        <div className="node-status" style={{ display: "flex", justifyContent: "space-between", fontSize: "9px" }}>
          <span>Min: {minVal.toFixed(1)}</span>
          <span>Max: {maxVal.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}
