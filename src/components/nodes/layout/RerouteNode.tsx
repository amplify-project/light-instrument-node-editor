import { useEffect } from "react";
import { Handle, Position } from "@xyflow/react";

export function RerouteNode({ data, id }: any) {
  useEffect(() => {
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {
        if (data.onData) {
          data.onData(id, incoming);
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
    <div className="serial-node reroute-node">
      <Handle type="target" position={Position.Left} className="multi-handle" style={{ left: "-4px" }} />
      <div className="node-header" title={"Bundles multiple inputs into a single output.\nInput: Any signal\nOutput: Same signal"}>
        <button className="delete-btn" style={{ fontSize: "12px" }} onClick={() => data.onDelete(id)}>×</button>
      </div>
      <Handle type="source" position={Position.Right} style={{ right: "-4px" }} />
    </div>
  );
}
