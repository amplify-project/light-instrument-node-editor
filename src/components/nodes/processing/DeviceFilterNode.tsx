import { useState, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";

export function DeviceFilterNode({ data, id }: any) {
  const deviceFilter = data.deviceFilter ?? data.filterValue ?? "";
  const portFilter = data.portFilter ?? "";
  const [lastRelayed, setLastRelayed] = useState<any>(null);

  useEffect(() => {
    // Register this node to receive data
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {
        if (incoming && typeof incoming === "object") {
          const deviceMatch = !deviceFilter || incoming.device === deviceFilter;
          const portMatch = !portFilter || incoming.port === portFilter;

          if (deviceMatch && portMatch) {
            setLastRelayed(incoming);

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
  }, [deviceFilter, portFilter, id, data]);

  return (
    <div className="serial-node filter-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <span>Device Filter</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <label style={{ fontSize: "10px", color: "#888" }}>Device Name:</label>
        <input
          type="text"
          value={deviceFilter}
          onChange={(e) => data.updateNodeData?.(id, { deviceFilter: e.target.value })}
          placeholder="e.g. sender1"
        />

        <label style={{ fontSize: "10px", color: "#888", marginTop: "8px", display: "block" }}>Device Port:</label>
        <input
          type="text"
          value={portFilter}
          onChange={(e) => data.updateNodeData?.(id, { portFilter: e.target.value })}
          placeholder="e.g. sensorA"
        />

        {lastRelayed && (
          <div className="node-status">
            Relayed: {lastRelayed.device}:{lastRelayed.port}:{lastRelayed.value}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
