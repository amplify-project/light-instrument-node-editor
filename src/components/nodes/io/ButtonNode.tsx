import { useState } from "react";
import { Handle, Position } from "@xyflow/react";

export function ButtonNode({ data, id }: any) {
  const isToggle = data.isToggle ?? false;
  const [toggleState, setToggleState] = useState(false);
  const [isPressedMomentary, setIsPressedMomentary] = useState(false);

  const handlePress = () => {
    if (isToggle) {
      const newState = !toggleState;

      setToggleState(newState);

      if (data.onData) {
        data.onData(id, {
          device: "button",
          port: "toggle",
          value: newState ? 1 : 0,
        });
      }
    } else {
      setIsPressedMomentary(true);

      if (data.onData) {
        data.onData(id, {
          device: "button",
          port: "press",
          value: 1,
        });
      }
    }
  };

  const handleRelease = () => {
    if (!isToggle && isPressedMomentary) {
      setIsPressedMomentary(false);

      if (data.onData) {
        data.onData(id, {
          device: "button",
          port: "press",
          value: 0,
        });
      }
    }
  };

  const displayPressed = isToggle ? toggleState : isPressedMomentary;

  return (
    <div className="serial-node button-node">
      <div className="node-header" title={"Interactive button that emits signals on press and release (momentary) or alternates state (toggle).\nOutput: Numeric signal (0 or 1)"}>
        <span>Button</span>
        <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
      </div>

      <div className="node-content nodrag">
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <input
            type="checkbox"
            id={`toggle-${id}`}
            checked={isToggle}
            onChange={(e) => data.updateNodeData?.(id, { isToggle: e.target.checked })}
            style={{ margin: 0 }}
          />
          <label htmlFor={`toggle-${id}`} style={{ fontSize: "11px", color: "#eee", cursor: "pointer" }}>
            Toggle Mode
          </label>
        </div>

        <button
          onMouseDown={handlePress}
          onMouseUp={handleRelease}
          onMouseLeave={handleRelease}
          style={{
            width: "100%",
            marginTop: "4px",
            height: "40px",
            backgroundColor: displayPressed ? "#646cff" : "#444",
            color: displayPressed ? "#fff" : "#eee",
            fontWeight: "bold",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            transition: "background-color 0.1s",
          }}
        >
          {displayPressed ? (isToggle ? "ON" : "PRESSED") : (isToggle ? "OFF" : "PUSH")}
        </button>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
