# Node Documentation

This document provides a description of all available nodes in the node-based editor, including their functions, inputs, and outputs.

## Action

### Command

Converts a trigger signal into a structured command packet for the serial output.

- **Input**: Any signal
- **Output**: Command packet `{device, port, command, value}`
- **Note**: Use "#" in parameters to inject incoming value.

## Display

### Graph

Visualizes incoming numeric data on a real-time line chart.

- **Input**: Numeric value

### Log

Displays a scrollable history of incoming data packets with timestamps.

- **Input**: Any data

### Statistics

Maintains a live count of received packets grouped by device name.

- **Input**: Structured packet

## Input & IO

### Button

Interactive button that emits signals on press and release (momentary) or alternates state (toggle).

- **Output**: Numeric signal (0 or 1)

### CSV Writer

Saves incoming data to a CSV file with timestamps.

- **Input**: Any data packet

### Function Generator

Generates periodic waveforms (Sine, Square, Triangle, Sawtooth) at a set frequency.

- **Output**: Periodic numeric signal (0 to 1)

### Serial Input

Interfaces with a physical serial port to receive raw data packets.

- **Output**: Structured packet `{device, port, value}`

### Serial Output

Sends formatted command packets to the connected serial port.

- **Input**: Command packet `{device, port, command, value}`

### Simulate

Reads recorded sensor data from a file and streams it into the editor.

- **Output**: Structured packet `{device, port, value}`

### Value

Provides a static numeric value that can be manually pushed or emitted on connection.

- **Output**: Numeric value

## Layout

### Frame

A visual grouping component used to organize and label collections of nodes.

- **Functional Details**: (No functional inputs or outputs)

## Math & Logic

### Boolean

Performs logical operations (AND, OR, XOR, NOT) on two boolean inputs (non-zero is true).

- **Inputs**: A, B
- **Output**: 1 or 0

### Compare

Compares input data against a threshold using mathematical operators.

- **Input**: Numeric value
- **Output**: Filtered numeric value

### Counter

Increments a internal counter for every message received and emits the total.

- **Input**: Any signal
- **Output**: Current count

### Cumulative Sum

Sums incoming numeric values over an infinite or sliding window buffer.

- **Input**: Numeric value
- **Output**: Current sum

### Delay

Emits received events after a specified delay.

- **Input**: Any signal
- **Output**: Delayed signal

### Edge Trigger

Detects rising or falling transitions in a signal and emits a single impulse.

- **Input**: Numeric signal
- **Output**: Impulse (1)

### Gate

Allows or blocks a data stream based on a separate control signal.

- **Inputs**: Signal, Control
- **Output**: Signal (if control is non-zero)

### Hysteresis

Uses two thresholds to provide stable on/off switching and prevent jitter.

- **Input**: Numeric value
- **Output**: 1 or 0

### Math

Performs arithmetic operations (+, -, *, /, %) on two numeric inputs.

- **Inputs**: A, B
- **Output**: Calculation result

### Peak Detection

Identifies local maxima (peaks) in a numeric stream and emits a trigger signal.

- **Input**: Numeric value
- **Output**: Trigger impulse

### Timer

Emits periodic pulses at a fixed interval.

- **Output**: Pulse signal

### Toggle

Alternates between 1 and 0 every time it receives an input pulse (Flip-Flop).

- **Input**: Any signal
- **Output**: 1 or 0

## Processing

### Clamp

Restricts the incoming signal to be within a minimum and maximum range.

- **Input**: Numeric value
- **Output**: Clamped value

### Combine RGB

Combines three numeric inputs into a CSV string format "r,g,b".

- **Inputs**: R, G, B
- **Output**: String "r,g,b"

### Deadband

Ignores small fluctuations in the signal within a specified threshold of the last value.

- **Input**: Numeric value
- **Output**: Filtered value

### Derivative

Calculates the rate of change (velocity) of the incoming signal.

- **Input**: Numeric value
- **Output**: Delta value

### Device Filter

Only allows packets from a specific device and/or port to pass through.

- **Input**: Structured packet
- **Output**: Filtered packet

### Envelope Follower

Tracks the peak level of a signal with configurable attack and release times.

- **Input**: Numeric value
- **Output**: Envelope value

### Map Range

Linearly rescales values from one range to another (e.g. 0-1023 to 0-255).

- **Input**: Numeric value
- **Output**: Scaled value

### Median Filter

Removes spike noise by outputting the median of a sliding window of values.

- **Input**: Numeric value
- **Output**: Filtered value

### Moving Average

Smooths signal by averaging values over a sliding window.

- **Input**: Numeric value
- **Output**: Averaged value

### Quantize

Snaps incoming values to the nearest multiple of a set step size.

- **Input**: Numeric value
- **Output**: Quantized value

### Rate

Measures the frequency (messages per second) of incoming data packets.

- **Input**: Any data
- **Output**: Frequency (Hz)

### Smooth

Applies exponential smoothing to the data stream to reduce jitter.

- **Input**: Numeric value
- **Output**: Smoothed value
