import { useState, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";
import { invoke } from "@tauri-apps/api/core";

export function SerialOutputNode({ data, id }: any) {
  const [lastSent, setLastSent] = useState("");
  const isConnected = !!data.activePort;
  const selectedPort = data.activePort;

  useEffect(() => {
    // Register this node to receive data
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {
        if (isConnected && selectedPort) {
          let payload = "";

          if (incoming && typeof incoming === "object") {
            // Support both direct command/value and mapped device/value for convenience
            const command = incoming.command || incoming.device || "cmd";
            const value = incoming.value !== undefined ? incoming.value : 0;

            payload = `${command},${value}\n`;
          } else if (typeof incoming === "string") {
            payload = incoming.endsWith("\n") ? incoming : incoming + "\n";
          }

          if (payload) {
            setLastSent(payload.trim());
            invoke("write_serial", { portName: selectedPort, data: payload }).catch(console.error);
          }
        }
      });
    }

    return () => {
      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [selectedPort, isConnected, id, data]);

  return (
    <div className="serial-node output-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <span>Serial Output</span>
      </div>

      <div className="node-content nodrag">
        <div className="node-status" style={{ color: isConnected ? "#46ff88" : "#ff4646" }}>
          {isConnected ? `Connected: ${selectedPort}` : "Not Connected"}
        </div>

        {lastSent && (
          <div className="node-status">
            Last Sent: {lastSent}
          </div>
        )}
      </div>
    </div>
  );
}
