import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export function StatisticsNode({ data, id }: any) {
  const [stats, setStats] = useState<Record<string, number>>({});
  const statsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {
        if (incoming && typeof incoming === "object" && incoming.device) {
          const device = String(incoming.device);

          statsRef.current[device] = (statsRef.current[device] || 0) + 1;
        }
      });
    }

    return () => {
      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [id, data]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats({ ...statsRef.current });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="serial-node statistics-node">
      <Handle type="target" position={Position.Left} className="multi-handle" />

      <div className="node-header" title={"Maintains a live count of received packets grouped by device name.\nInput: Structured packet"}>
        <span>Statistics</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span style={{ fontSize: "10px", color: "#888" }}>Device</span>
          <span style={{ fontSize: "10px", color: "#888" }}>Count</span>
        </div>
        <div
          style={{
            maxHeight: "150px",
            overflowY: "auto",
            background: "#121212",
            borderRadius: "4px",
            padding: "4px",
            border: "1px solid #333",
          }}
        >
          {Object.entries(stats).length === 0 ? (
            <div style={{ color: "#555", fontSize: "10px", textAlign: "center" }}>No data yet</div>
          ) : (
            <>
              {Object.entries(stats).sort((a, b) => b[1] - a[1]).map(([device, count]) => (
                <div
                  key={device}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "2px 0",
                    borderBottom: "1px solid #222",
                    fontSize: "10px",
                  }}
                >
                  <span style={{ color: "#46ccff" }}>{device}</span>
                  <span style={{ color: "#eee" }}>{count}</span>
                </div>
              ))}
              <div
                key="totals"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "2px 0",
                  borderTop: "1px solid #222",
                  fontSize: "10px",
                }}
              >
                <span style={{ color: "#46ccff" }}>Total</span>
                <span style={{ color: "#eee" }}>{Object.entries(stats).reduce((sum, [_, count]) => sum + count, 0)}</span>
              </div>
            </>
          )}
        </div>
        <button
          onClick={() => {
            statsRef.current = {};
            setStats({});
          }}
          style={{ marginTop: "4px" }}
        >
          Reset Counts
        </button>
      </div>
    </div>
  );
}
