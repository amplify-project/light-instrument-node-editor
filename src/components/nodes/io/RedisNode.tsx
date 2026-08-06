import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import { invoke } from "@tauri-apps/api/core";

export function RedisNode({ data, id }: any) {
  const [lastSent, setLastSent] = useState("");
  const lastSentRef = useRef("");

  const host = data.host ?? "localhost";
  const port = data.port ?? 6379;
  const channel = data.channel ?? "amplify";

  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (lastSentRef.current !== lastSent) {
        setLastSent(lastSentRef.current);
      }
    }, 100);

    return () => clearInterval(syncInterval);
  }, [lastSent]);

  useEffect(() => {
    if (data.registerConsumer) {
      data.registerConsumer(id, (incoming: any) => {
        let payload = "";

        if (incoming && typeof incoming === "object") {
          incoming["timestamp"] = Date.now() / 1000;
          payload = JSON.stringify(incoming);
        } else {
          payload = String(incoming);
        }

        if (payload) {
          lastSentRef.current = payload.length > 30 ? payload.substring(0, 27) + "..." : payload;

          invoke("redis_publish", {
            host: host,
            port: parseInt(port.toString()),
            channel: channel,
            message: payload,
          }).catch(console.error);
        }
      });
    }

    return () => {
      if (data.unregisterConsumer) {
        data.unregisterConsumer(id);
      }
    };
  }, [host, port, channel, id, data]);

  return (
    <div className="serial-node redis-node">
      <Handle type="target" position={Position.Left} className="multi-handle" />

      <div className="node-header" title={"Pipes data into a Redis PubSub channel.\nInput: Any data (serialized to JSON if object)\nOutput: None"}>
        <span>Redis PubSub</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <label style={{ fontSize: "10px", color: "#888" }}>Host:</label>
        <input
          type="text"
          value={host}
          onChange={(e) => data.updateNodeData(id, { host: e.target.value })}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        <label style={{ fontSize: "10px", color: "#888" }}>Port:</label>
        <input
          type="number"
          value={port}
          onChange={(e) => data.updateNodeData(id, { port: e.target.value })}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        <label style={{ fontSize: "10px", color: "#888" }}>Channel:</label>
        <input
          type="text"
          value={channel}
          onChange={(e) => data.updateNodeData(id, { channel: e.target.value })}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        {lastSent && (
          <div className="node-status">
            Last Sent: {lastSent}
          </div>
        )}
      </div>
    </div>
  );
}
