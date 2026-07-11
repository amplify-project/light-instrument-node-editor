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
            const device = incoming.device || "";
            const port = incoming.port || "";
            const command = incoming.command || "";
            const value = incoming.value !== undefined ? incoming.value : 0;

            if (device && port && command) {
              payload = `${device},${port},${command},${value}\n`;
            }
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
      <Handle type="target" position={Position.Left} className="multi-handle" />

      <div className="node-header" title={"Sends formatted command packets to the connected serial port.\nInput: Command packet {device, port, command, value}"}>
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
