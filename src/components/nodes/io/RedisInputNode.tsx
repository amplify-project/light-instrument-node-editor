import { useState, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export function RedisInputNode({ data, id }: any) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const host = data.host ?? "localhost";
  const port = data.port ?? 6379;
  const channel = data.channel ?? "amplify";

  useEffect(() => {
    const unlisten = listen<any>("redis-message", (event) => {
      const { host: msgHost, port: msgPort, channel: msgChannel, message } = event.payload;

      if (msgHost === host && msgPort === parseInt(port.toString()) && msgChannel === channel && isConnected) {
        setLastMessage(message.length > 30 ? message.substring(0, 27) + "..." : message);

        try {
          const parsed = JSON.parse(message);

          if (data.onData) {
            data.onData(id, parsed);
          }
        } catch (e) {
          return;
        }
      }
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, [host, port, channel, isConnected, id, data]);

  const toggleConnect = async () => {
    if (isConnected) {
      await invoke("redis_unsubscribe", {
        host: host,
        port: parseInt(port.toString()),
        channel: channel
      });

      setIsConnected(false);
    } else {
      try {
        await invoke("redis_subscribe", {
          host: host,
          port: parseInt(port.toString()),
          channel: channel
        });

        setIsConnected(true);
      } catch (e) {
        alert("Failed to subscribe to Redis: " + e);
      }
    }
  };

  return (
    <div className="node input-node redis-node">
      <div className="node-header" title={"Subscribes to a Redis PubSub channel.\nOutput: Parsed JSON or raw string"}>
        <span>Redis Input</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <label style={{ fontSize: "10px", color: "#888" }}>Host:</label>
        <input
          type="text"
          value={host}
          onChange={(e) => data.updateNodeData(id, { host: e.target.value })}
          disabled={isConnected}
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
          disabled={isConnected}
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
          disabled={isConnected}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
          <button
            onClick={toggleConnect}
            style={{ flex: 1 }}
          >
            {isConnected ? "Disconnect" : "Connect"}
          </button>
        </div>

        {lastMessage && (
          <div className="node-status">
            Last: {lastMessage}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
