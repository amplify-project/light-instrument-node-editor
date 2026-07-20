use serialport;
use tauri::menu::{AboutMetadata, MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use std::collections::HashMap;
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager, State, WindowEvent};

struct SerialState {
    ports: Mutex<HashMap<String, Box<dyn serialport::SerialPort>>>,
    simulation_running: Arc<AtomicBool>
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

#[tauri::command]
fn append_to_file(path: String, content: String) -> Result<(), String> {
    use std::fs::OpenOptions;
    use std::io::Write;

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
        .map_err(|e| e.to_string())?;

    file.write_all(content.as_bytes()).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let new_menu_entry = MenuItemBuilder::new("New")
                .id("new-custom")
                .accelerator("CmdOrCtrl+N")
                .build(app)?;

            let open_menu_entry = MenuItemBuilder::new("Open")
                .id("open-custom")
                .accelerator("CmdOrCtrl+O")
                .build(app)?;

            let save_menu_entry = MenuItemBuilder::new("Save")
                .id("save-custom")
                .accelerator("CmdOrCtrl+S")
                .build(app)?;

            let save_as_menu_entry = MenuItemBuilder::new("Save As")
                .id("save-as-custom")
                .build(app)?;

            let quit_menu_entry = MenuItemBuilder::new("Quit")
                .id("quit-custom")
                .accelerator("CmdOrCtrl+Q")
                .build(app)?;

            let submenu = SubmenuBuilder::new(app, "File")
                .about(Some(AboutMetadata::default()))
                .separator()
                .item(&new_menu_entry)
                .separator()
                .item(&open_menu_entry)
                .separator()
                .item(&save_menu_entry)
                .item(&save_as_menu_entry)
                .separator()
                .item(&quit_menu_entry)
                .build()?;

            let menu = MenuBuilder::new(app)
                .items(&[&submenu])
                .build()?;

            app.set_menu(menu)?;

            app.on_menu_event(move |app_handle, event| {
                if let Some(window) = app_handle.get_webview_window("main") {
                    if event.id() == quit_menu_entry.id() {
                        let _ = window.emit("close-requested", ());
                    } else if event.id() == save_menu_entry.id() {
                        let _ = window.emit("save-requested", ());
                    } else if event.id() == save_as_menu_entry.id() {
                        let _ = window.emit("save-as-requested", ());
                    } else if event.id() == open_menu_entry.id() {
                        let _ = window.emit("open-requested", ());
                    } else if event.id() == new_menu_entry.id() {
                        let _ = window.emit("new-requested", ());
                    }
                }
            });

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.emit("close-requested", ());
            }
        })
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
            stop_simulation,
            append_to_file
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application")
}
