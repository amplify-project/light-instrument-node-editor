import React, { useState, useEffect, useRef } from "react";

interface NodeOption {
  type: string;
  label: string;
  category: string;
}

const nodeOptions: NodeOption[] = [
  // Communication
  { type: "button", label: "Button", category: "Communication" },
  { type: "functionGenerator", label: "Function Generator", category: "Communication" },
  { type: "timer", label: "Timer", category: "Communication" },
  { type: "simulate", label: "Simulate", category: "Communication" },
  // Processing
  { type: "clamp", label: "Clamp", category: "Processing" },
  { type: "cumulativeSum", label: "Cumulative Sum", category: "Processing" },
  { type: "deadband", label: "Deadband", category: "Processing" },
  { type: "derivative", label: "Derivative", category: "Processing" },
  { type: "deviceFilter", label: "Device Filter", category: "Processing" },
  { type: "envelopeFollower", label: "Envelope Follower", category: "Processing" },
  { type: "hysteresis", label: "Hysteresis", category: "Processing" },
  { type: "mapRange", label: "Map Range", category: "Processing" },
  { type: "medianFilter", label: "Median Filter", category: "Processing" },
  { type: "movingAverage", label: "Moving Average", category: "Processing" },
  { type: "peakDetection", label: "Peak Detection", category: "Processing" },
  { type: "quantize", label: "Quantize", category: "Processing" },
  { type: "rate", label: "Rate", category: "Processing" },
  { type: "smooth", label: "Smooth", category: "Processing" },
  // Logic
  { type: "boolean", label: "Boolean", category: "Logic" },
  { type: "compare", label: "Compare", category: "Logic" },
  { type: "edgeTrigger", label: "Edge Trigger", category: "Logic" },
  { type: "gate", label: "Gate", category: "Logic" },
  { type: "toggle", label: "Toggle", category: "Logic" },
  // Action
  { type: "command", label: "Command", category: "Action" },
  // Visualization
  { type: "graph", label: "Graph", category: "Visualization" },
  { type: "log", label: "Log", category: "Visualization" },
  { type: "statistics", label: "Statistics", category: "Visualization" },
  // Layout
  { type: "frame", label: "Frame", category: "Layout" },
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

  const filteredOptions = nodeOptions
    .filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const categoryOrder = ["Communication", "Processing", "Logic", "Action", "Visualization", "Layout"];
      const catA = categoryOrder.indexOf(a.category);
      const catB = categoryOrder.indexOf(b.category);

      if (catA !== catB) {
        return catA - catB;
      }

      return a.label.localeCompare(b.label);
    });

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
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />

      <div className="node-search-results">
        {filteredOptions.map((opt, index) => {
          const showHeader = index === 0 || filteredOptions[index - 1].category !== opt.category;

          return (
            <React.Fragment key={opt.type}>
              {showHeader && (
                <div className="node-search-header">{opt.category}</div>
              )}

              <div
                className={`node-search-item ${index === selectedIndex ? "selected" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(opt.type);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {opt.label}
              </div>
            </React.Fragment>
          );
        })}

        {filteredOptions.length === 0 && (
          <div className="node-search-item" style={{ fontStyle: "italic", cursor: "default" }}>
            No results
          </div>
        )}
      </div>
    </div>
  );
}
