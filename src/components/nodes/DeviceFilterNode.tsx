import { useState, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";

export function DeviceFilterNode({ data, id }: any) {
  const [filterValue, setFilterValue] = useState(data.filterValue || "");
  const [lastRelayed, setLastRelayed] = useState<any>(null);

  useEffect(() => {
    // Register this node to receive data
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {
        if (incoming && typeof incoming === "object" && incoming.device === filterValue) {
          setLastRelayed(incoming);

          if (data.onData) {
            data.onData(id, incoming);
          }
        }
      });
    }

    return () => {
      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [filterValue, id, data]);

  return (
    <div className="serial-node filter-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <span>Device Filter</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <label style={{ fontSize: "10px", color: "#888" }}>Filter by Device:</label>
        <input
          type="text"
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          placeholder="e.sender1"
        />

        {lastRelayed && (
          <div className="node-status">
            Relayed: {lastRelayed.device}:{lastRelayed.value}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
