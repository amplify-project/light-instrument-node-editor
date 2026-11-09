import { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import { listen } from "@tauri-apps/api/event";

interface RemoteControlPayload {
  name: string;
  action: string;
  value: any;
}

export function RemoteInputNode({ data, id }: any) {
  const remoteName = data.remoteName ?? "";
  const [lastPacket, setLastPacket] = useState<any>(null);
  const lastPacketRef = useRef<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastPacket(lastPacketRef.current);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unlisten = listen<RemoteControlPayload>("remote-control", (event) => {
      const { name, action, value } = event.payload;

      if (name === remoteName) {
        const packet = { device: name, port: action, value: value };

        lastPacketRef.current = packet;

        if (data.onData) {
          data.onData(id, packet);
        }
      }
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, [remoteName, id, data.onData]);

  return (
    <div className="node remote-node">
      <div className="node-header" title={"Receives remote control packets via UDP.\nOutput: Structured packet {device, port, value}"}>
        <span>Remote Input</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <label style={{ fontSize: "10px", color: "#888" }}>Remote Name:</label>
        <input
          type="text"
          value={remoteName}
          onChange={(e) => data.updateNodeData?.(id, { remoteName: e.target.value })}
          placeholder="e.g. controller_1"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        <div className="node-status">
          {lastPacket && (
            `${lastPacket.device}:${lastPacket.port}:${lastPacket.value}`
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
