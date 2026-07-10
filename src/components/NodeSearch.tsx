import React, { useState, useEffect, useRef } from "react";

interface NodeOption {
  type: string;
  label: string;
}

const nodeOptions: NodeOption[] = [
  { type: "boolean", label: "Boolean" },
  { type: "clamp", label: "Clamp" },
  { type: "command", label: "Command" },
  { type: "compare", label: "Compare" },
  { type: "cumulativeSum", label: "Cumulative Sum" },
  { type: "deadband", label: "Deadband" },
  { type: "derivative", label: "Derivative" },
  { type: "deviceFilter", label: "Device Filter" },
  { type: "edgeTrigger", label: "Edge Trigger" },
  { type: "envelopeFollower", label: "Envelope Follower" },
  { type: "frame", label: "Frame" },
  { type: "gate", label: "Gate" },
  { type: "graph", label: "Graph" },
  { type: "hysteresis", label: "Hysteresis" },
  { type: "log", label: "Log" },
  { type: "mapRange", label: "Map Range" },
  { type: "medianFilter", label: "Median Filter" },
  { type: "movingAverage", label: "Moving Average" },
  { type: "peakDetection", label: "Peak Detection" },
  { type: "quantize", label: "Quantize" },
  { type: "rate", label: "Rate" },
  { type: "simulate", label: "Simulate" },
  { type: "smooth", label: "Smooth" },
  { type: "toggle", label: "Toggle" },
];

interface NodeSearchProps {
  onSelect: (type: string) => void;
  onClose: () => void;
  x: number;
  y: number;
}

export function NodeSearch({ onSelect, onClose, x, y }: NodeSearchProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = nodeOptions.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredOptions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();

      if (filteredOptions[selectedIndex]) {
        onSelect(filteredOptions[selectedIndex].type);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (filteredOptions.length === 0 && search === "") return null;

  return (
    <div
      className="node-search-container"
      style={{ left: x, top: y }}
    >
      <input
        ref={inputRef}
        type="text"
        placeholder="Search nodes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(onClose, 100)} // Small delay to allow onMouseDown on items
      />

      <div className="node-search-results">
        {filteredOptions.map((opt, index) => (
          <div
            key={opt.type}
            className={`node-search-item ${index === selectedIndex ? "selected" : ""}`}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(opt.type);
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            {opt.label}
          </div>
        ))}

        {filteredOptions.length === 0 && (
          <div className="node-search-item" style={{ fontStyle: "italic", cursor: "default" }}>
            No results
          </div>
        )}
      </div>
    </div>
  );
}
