import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export function GateNode({ data, id }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const controlRef = useRef<boolean>(false);

  useEffect(() => {
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any, targetHandle?: string) => {

        if (incoming && typeof incoming === "object") {

          if (targetHandle === "control") {
            const open = incoming.value !== 0;
            controlRef.current = open;
            setIsOpen(open);
          } else {
            // Signal input
            if (controlRef.current && data.onData) {
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
  }, [id, data]);

  return (
    <div className="serial-node gate-node">
      <Handle type="target" position={Position.Left} id="signal" style={{ top: "60%" }} />
      <label style={{ position: "absolute", left: "12px", top: "54%", fontSize: "8px", color: "#888" }}>Signal</label>

      <Handle type="target" position={Position.Left} id="control" style={{ top: "80%" }} />
      <label style={{ position: "absolute", left: "12px", top: "73%", fontSize: "8px", color: "#888" }}>Control</label>

      <div className="node-header" title={"Allows or blocks a data stream based on a separate control signal.\nInputs: Signal, Control\nOutput: Signal (if control is non-zero)"}>
        <span>Gate</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <div className="node-status" style={{ color: isOpen ? "#46ff88" : "#ff4646", textAlign: "center", marginLeft: 40, marginBottom: 5 }}>
          {isOpen ? "OPEN" : "CLOSED"}
        </div>
      </div>

      <Handle type="source" position={Position.Right} style={{ top: "60%" }} />
    </div>
  );
}
