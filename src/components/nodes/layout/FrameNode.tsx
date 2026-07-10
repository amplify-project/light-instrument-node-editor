
import { NodeResizer } from "@xyflow/react";

export function FrameNode({ data, id, selected }: any) {
  return (
    <>
      <NodeResizer
        minWidth={100}
        minHeight={100}
        isVisible={selected}
      />

      <div
        className="serial-node frame-node"
        style={{
          width: "100%",
          height: "100%",
          margin: 0,
        }}
      >
        <div className="node-header">
          <input
            className="nodrag"
            style={{
              background: "transparent",
              border: "none",
              color: "#eee",
              fontSize: "12px",
              fontWeight: "bold",
              padding: 0,
              margin: 0,
              flex: 1,
              outline: "none",
            }}
            value={data.label ?? "Frame"}
            onChange={(e) => data.updateNodeData?.(id, { label: e.target.value })}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          <button className="delete-btn" onClick={() => data.onDelete(id)}>×</button>
        </div>
      </div>
    </>
  );
}
