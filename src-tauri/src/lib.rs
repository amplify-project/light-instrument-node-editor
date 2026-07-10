use serialport;
use std::collections::HashMap;
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, State};

struct SerialState {
    ports: Mutex<HashMap<String, Box<dyn serialport::SerialPort>>>,
    simulation_running: Arc<AtomicBool>,
}

#[tauri::command]
fn list_ports() -> Vec<String> {
    match serialport::available_ports() {
        Ok(ports) => ports.into_iter().map(|p| p.port_name).collect(),
        Err(_) => vec![],
    }
}

#[tauri::command]
fn open_port(
    state: State<'_, SerialState>,
    app: AppHandle,
    port_name: String,
    baud_rate: u32,
) -> Result<(), String> {
    let port = serialport::new(port_name.clone(), baud_rate)
        .timeout(std::time::Duration::from_millis(10))
        .open()
        .map_err(|e| e.to_string())?;

    let mut ports = state.ports.lock().unwrap();
    ports.insert(
        port_name.clone(),
        port.try_clone().map_err(|e| e.to_string())?,
    );

    // Start a background thread to read from the port
    let mut reader = port;
    let p_name = port_name.clone();

    std::thread::spawn(move || {
        let mut serial_buf: Vec<u8> = vec![0; 1024];

        loop {
            match reader.read(serial_buf.as_mut_slice()) {
                Ok(t) => {
                    let data = String::from_utf8_lossy(&serial_buf[..t]).to_string();
                    let payload = serde_json::json!({
                        "port": p_name,
                        "data": data
                    });
                    let _ = app.emit("serial-data", payload);
                }
                Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => (),
                Err(_) => break,
            }
        }
    });

    Ok(())
}

#[tauri::command]
fn close_port(state: State<'_, SerialState>, port_name: String) {
    let mut ports = state.ports.lock().unwrap();
    ports.remove(&port_name);
}

#[tauri::command]
fn write_serial(state: State<'_, SerialState>, port_name: String, data: String) -> Result<(), String> {
    let mut ports = state.ports.lock().unwrap();

    if let Some(port) = ports.get_mut(&port_name) {
        port.write_all(data.as_bytes()).map_err(|e| e.to_string())?;

        Ok(())
    } else {
        Err("Port not open".to_string())
    }
}

#[tauri::command]
fn save_file(path: String, contents: String) -> Result<(), String> {
    std::fs::write(path, contents).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn start_simulation(state: State<'_, SerialState>, app: AppHandle, path: String, interval_ms: u64) -> Result<(), String> {
    state.simulation_running.store(true, Ordering::SeqCst);
    let running = state.simulation_running.clone();

    std::thread::spawn(move || {
        let file = match File::open(&path) {
            Ok(f) => f,
            Err(_) => {
                running.store(false, Ordering::SeqCst);
                return;
            }
        };

        let reader = BufReader::new(file);

        for line in reader.lines() {
            if !running.load(Ordering::SeqCst) {
                break;
            }

            if let Ok(content) = line {
                let payload = serde_json::json!({
                    "port": "SIMULATION",
                    "data": format!("{}\n", content)
                });

                let _ = app.emit("serial-data", payload);

                // Add a delay to simulate real data rate
                std::thread::sleep(std::time::Duration::from_millis(interval_ms));
            }
        }

        running.store(false, Ordering::SeqCst);
        let _ = app.emit("simulation-finished", ());
    });

    Ok(())
}

#[tauri::command]
fn stop_simulation(state: State<'_, SerialState>) {
    state.simulation_running.store(false, Ordering::SeqCst);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(SerialState {
            ports: Mutex::new(HashMap::new()),
            simulation_running: Arc::new(AtomicBool::new(false)),
        })
        .invoke_handler(tauri::generate_handler![
            list_ports,
            open_port,
            close_port,
            write_serial,
            save_file,
            load_file,
            start_simulation,
            stop_simulation
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
