import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import { invoke } from "@tauri-apps/api/core";

interface LastSentMessage {
  message: string;
  isError: boolean;
}

export function OSCOutputNode({ data, id }: any) {
  const [lastSent, setLastSent] = useState<LastSentMessage>({ message: "", isError: false });
  const lastSentRef = useRef<LastSentMessage>({ message: "", isError: false });

  const hostPort = data.hostPort ?? "localhost:9000";
  const address = data.address ?? "/amplify";
  const value = data.value ?? "#";

  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (lastSentRef.current.message !== lastSent.message || lastSentRef.current.isError !== lastSent.isError) {
        setLastSent(lastSentRef.current);
      }
    }, 100);

    return () => clearInterval(syncInterval);
  }, [lastSent]);

  useEffect(() => {
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {
        if (!incoming) return;

        const finalAddress = String(address).replace(
          /#/g, incoming.value
        ).replace(
          /@/g, incoming.port
        ).replace(
          /%/g, incoming.device
        );

        const finalValue = String(value).replace(
          /#/g, incoming.value
        ).replace(
          /@/g, incoming.port
        ).replace(
          /%/g, incoming.device
        );

        invoke("write_osc", {
          hostPort: hostPort.trim(),
          address: finalAddress.trim(),
          value: finalValue,
        }).then(() => {
          lastSentRef.current = {
            message: `${finalAddress.trim().startsWith('/') ? finalAddress.trim() : '/' + finalAddress.trim()} ${finalValue}`,
            isError: false
          };
        }).catch((err) => {
          lastSentRef.current = {
            message: String(err).length > 35 ? String(err).substring(0, 38) + "..." : String(err),
            isError: true
          };

          console.error(err);
        });
      });
    }

    return () => {
      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [hostPort, address, value, id, data]);

  const displayValue = lastSent.message.length > 30
    ? lastSent.message.substring(0, 27) + "..."
    : lastSent.message;

  return (
    <div className="node output-node osc-output-node">
      <Handle type="target" position={Position.Left} className="multi-handle" />

      <div className="node-header" title={"Sends OSC messages over UDP.\nInput: Any message with a 'value' property\nOutput: None"}>
        <span>OSC Output</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <label style={{ fontSize: "10px", color: "#888" }}>Host:</label>
        <input
          type="text"
          value={hostPort}
          onChange={(e) => data.updateNodeData(id, { hostPort: e.target.value })}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        <label style={{ fontSize: "10px", color: "#888" }}>OSC Pattern:</label>
        <input
          type="text"
          value={address}
          onChange={(e) => data.updateNodeData(id, { address: e.target.value })}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        <label style={{ fontSize: "10px", color: "#888" }}>Value:</label>
        <input
          type="text"
          value={value}
          onChange={(e) => data.updateNodeData(id, { value: e.target.value })}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        {lastSent.message && (
          <div className="node-status" style={{ color: lastSent.isError ? "#f00" : "#888"}}>
            {displayValue}
          </div>
        )}
      </div>
    </div>
  );
}
