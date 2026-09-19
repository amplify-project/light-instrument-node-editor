# Node Documentation

This section provides a description of all available nodes in the node-based
editor, including their functions, inputs, and outputs.

## Action

### Command

Converts a trigger signal into a structured command packet for the serial
output.

- **Input**: Any signal
- **Output**: Command packet `{device, port, command, value}`
- **Parameters**:
  - **Device**: Target device name (optional)
  - **Port**: Target port name (optional)
  - **Command Name**: The animation or command to execute
  - **Parameters**: Command-specific parameters (e.g., `r,g,b,speed`)
- **Note**: Use "#" in parameters to inject incoming value.

### Script

Executes a sequence of commands and delays.

- **Input**: Any signal
- **Output**: Command packets `{device, port, command, value}`
- **Parameters**:
  - **Delay:** `delay [ms]`
- **Note:** Emitted messages are of the format `command 'device' 'port' 'params'`

Example:

    breathe 'receiver1' 'LED1' '255,0,0,20'
    delay 500
    stop '' '' ''

This will send a `breathe` command to `receiver1` port `LED1`, which causes a
breathe animation with color red and a speed of 20 BPM to start. Then, the
script waits for 500ms and then issues a `stop` command (empty strings for
device and port send the command to all devices/port).

### Toggle Command

Similar to the *Command* node, it converts a trigger signal into a structured
command packet. However, if it receives a signal with a value of 0, it
automatically emits a `stop` command instead. Any other value emits the
configured command.

- **Input**: Any signal
- **Output**: Command packet `{device, port, command, value}`
- **Parameters**:
  - **Device**: Target device name (optional)
  - **Port**: Target port name (optional)
  - **Command Name**: The animation or command to execute
  - **Parameters**: Command-specific parameters (e.g., `r,g,b,speed`)
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

Interactive button that emits signals on press and release (momentary) or
alternates state (toggle).

- **Output**: Numeric signal (0 or 1)
- **Parameters**:
  - **Toggle Mode**: If checked, the button alternates between 0 and 1 on each click.
    Otherwise, it sends 1 on press and 0 on release.

### CSV Writer

Saves incoming data to a CSV file with timestamps.

- **Input**: Any data packet

### Function Generator

Generates periodic waveforms (Sine, Square, Triangle, Sawtooth) at a set
frequency.

- **Output**: Periodic numeric signal (0 to 1)
- **Parameters**:
  - **Waveform**: The shape of the generated signal.
  - **Frequency (Hz)**: How many times the waveform repeats per second.
  - **Sampling Rate (Hz)**: How many data points are generated per second.

### Load Value

Emits the message whenever a new value is stored under a matching name.

- **Output**: Shared message
- **Parameters**:
  - **Name**: The name of the channel to load from.

### OSC Output

Sends messages to other software or hardware using the Open Sound Control (OSC)
protocol over UDP.

- **Input**: Any message with a `value` property
- **Parameters**:
  - **Host:**: Target network address (e.g., `localhost:9000`)
  - **OSC Pattern**: The OSC address path (e.g., `/amplify`)
  - **Value**: The data to send. Multiple values can be sent by separating them
    with commas (e.g., `1.0, 2, hello`).
- **Note**: Use "#" in the value field to inject the `value` from the incoming
  message.

### Redis Input

Subscribes to a Redis PubSub channel and emits received messages.

- **Output**: Structured data (parsed JSON)
- **Parameters**:
  - **Hostname**: Redis server hostname
  - **Port**: Redis server port
  - **Channel**: PubSub channel name

### Redis Output

Pipes data into a Redis PubSub channel.

- **Input**: Any structured JSON data
- **Parameters**:
  - **Hostname**: Redis server hostname
  - **Port**: Redis server port
  - **Channel**: PubSub channel name

### Serial Input

Interfaces with a physical serial port to receive raw data packets.

- **Output**: Structured packet `{device, port, value}`

### Serial Output

Sends formatted command packets to the connected serial port.

- **Input**: Command packet `{device, port, command, value}`

### Simulate

Reads recorded sensor data from a file and streams it into the editor.

- **Output**: Structured packet `{device, port, value}`

### Store Value

Stores incoming messages under a user-defined name.

- **Input**: Any message
- **Parameters**:
  - **Name**: The name of the channel to store to.

### Value

Provides a static numeric value that can be manually pushed or emitted on
connection.

- **Output**: Numeric value

## Layout

### Annotation

Allows adding text annotations to the node graph.

### Frame

A visual grouping component used to organize and label collections of nodes.

### Reroute

Bundles multiple inputs into a single output.

- **Input**: Any signal
- **Output**: Same signal

### Indicator

Indicator, which lights up whenever a message passes through it.

- **Input**: Any signal
- **Output**: Same signal

## Math & Logic

### Boolean

Performs logical operations (AND, OR, XOR, NOT) on two boolean inputs (non-zero
is true).

- **Inputs**: A, B
- **Output**: 1 or 0
- **Parameters**:
  - **Operation**: The logical operation to perform.

### Compare

Compares input data against a threshold using mathematical operators.

- **Input**: Numeric value
- **Output**: Filtered numeric value
- **Parameters**:
  - **Operator**: The comparison operator (>, <, >=, <=, ==, !=).
  - **Threshold**: The value to compare against.

### Counter

Increments a internal counter for every message received and emits the total.

- **Input**: Any signal
- **Output**: Current count

### Cumulative Sum

Sums incoming numeric values over an infinite or sliding window buffer.

- **Input**: Numeric value
- **Output**: Current sum
- **Parameters**:
  - **Buffer Type**: `Infinite` (keeps summing forever) or `Sliding` (sums only
    the last N values).
  - **Window Size**: The number of values to keep in the sliding window.

### Delay

Emits received events after a specified delay.

- **Input**: Any signal
- **Output**: Delayed signal
- **Parameters**:
  - **Delay (ms)**: The time to wait before emitting the signal.

### Edge Trigger

Detects rising or falling transitions in a signal and emits a single impulse.

- **Input**: Numeric signal
- **Output**: Impulse (1)
- **Parameters**:
  - **Type**: `Rising` (0 to >0), `Falling` (>0 to 0), or `Both`.

### Gate

Allows or blocks a data stream based on a separate control signal.

- **Inputs**: Signal, Control
- **Output**: Signal (if control is non-zero)

### Hysteresis

Uses two thresholds to provide stable on/off switching and prevent jitter.

- **Input**: Numeric value
- **Output**: 1 or 0
- **Parameters**:
  - **Low Threshold**: The value below which the output becomes 0.
  - **High Threshold**: The value above which the output becomes 1.

### Math

Performs arithmetic operations (+, -, *, /, %) on two numeric inputs.

- **Inputs**: A, B
- **Output**: Calculation result
- **Parameters**:
  - **Operation**: The arithmetic operation to perform.
  - **Operand B**: Static value for B if the input handle is not connected.

### Peak Detection

Identifies local maxima (peaks) in a numeric stream and emits a trigger signal.

- **Input**: Numeric value
- **Output**: Trigger impulse
- **Parameters**:
  - **Threshold**: Minimum value to be considered a peak.
  - **Window**: Number of samples to consider when identifying a peak.

### Timer

Emits periodic pulses at a fixed interval.

- **Output**: Pulse signal
- **Parameters**:
  - **Interval (ms)**: The time between pulses.

### Toggle

Alternates between 1 and 0 every time it receives an input pulse (Flip-Flop).

- **Input**: Any signal
- **Output**: 1 or 0

## Processing

### Clamp

Restricts the incoming signal to be within a minimum and maximum range.

- **Input**: Numeric value
- **Output**: Clamped value
- **Parameters**:
  - **Min**: Minimum allowed value.
  - **Max**: Maximum allowed value.

### Combine RGB

Combines three numeric inputs into a string of format "r,g,b". This is useful
for merging inputs from three different sources into a color for use in the
*Command* node.

- **Inputs**: R, G, B
- **Output**: String "r,g,b"

### Deadband

Ignores small fluctuations in the signal within a specified threshold of the
last value.

- **Input**: Numeric value
- **Output**: Filtered value
- **Parameters**:
  - **Threshold**: The minimum change required to emit a new value.

### Derivative

Calculates the rate of change (velocity) of the incoming signal.

- **Input**: Numeric value
- **Output**: Delta value

### Device Filter

Only allows packets from a specific device and/or port to pass through. A
trailing asterisk in the *Device* field can be used as wildcard.

- **Input**: Structured packet
- **Output**: Filtered packet
- **Parameters**:
  - **Device**: The device name to filter for.
  - **Port**: The port name to filter for.

### Envelope Follower

Tracks the peak level of a signal with configurable attack and release times.

- **Input**: Numeric value
- **Output**: Envelope value
- **Parameters**:
  - **Attack (ms)**: Time taken to reach the peak value.
  - **Release (ms)**: Time taken to decay from the peak value.

### Map Range

Linearly rescales values from one range to another (e.g. 0-1023 to 0-255).

- **Input**: Numeric value
- **Output**: Scaled value
- **Parameters**:
  - **In Min / In Max**: The expected range of the input signal.
  - **Out Min / Out Max**: The desired range of the output signal.

### Median Filter

Removes spike noise by outputting the median of a sliding window of values.

- **Input**: Numeric value
- **Output**: Filtered value
- **Parameters**:
  - **Window Size**: The number of samples to use for the median calculation.

### Moving Average

Smooths signal by averaging values over a sliding window.

- **Input**: Numeric value
- **Output**: Averaged value
- **Parameters**:
  - **Window Size**: The number of samples to average over.

### Quantize

Snaps incoming values to the nearest multiple of a set step size.

- **Input**: Numeric value
- **Output**: Quantized value
- **Parameters**:
  - **Step Size**: The increment to snap to.

### Rate

Measures the frequency (messages per second) of incoming data packets.

- **Input**: Any data
- **Output**: Frequency (Hz)

### Smooth

Applies exponential smoothing to the data stream to reduce jitter.

- **Input**: Numeric value
- **Output**: Smoothed value
- **Parameters**:
  - **Factor (0-1)**: The smoothing strength (higher is smoother, but slower).
