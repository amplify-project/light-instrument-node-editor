use serialport;
use tauri::menu::{AboutMetadata, MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use std::collections::HashMap;
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager, State, WindowEvent};

struct PortEntry {
    port: Box<dyn serialport::SerialPort>,
    stop_signal: Arc<AtomicBool>,
}

struct RedisSubscriptionEntry {
    stop_signal: Arc<AtomicBool>,
}

struct SerialState {
    ports: Mutex<HashMap<String, PortEntry>>,
    redis_subscriptions: Mutex<HashMap<String, RedisSubscriptionEntry>>,
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
    {
        let ports = state.ports.lock().unwrap();

        if ports.contains_key(&port_name) {
            return Err("Port already open".to_string());
        }
    }

    let port = serialport::new(port_name.clone(), baud_rate)
        .timeout(std::time::Duration::from_millis(10))
        .open()
        .map_err(|e| e.to_string())?;

    let stop_signal = Arc::new(AtomicBool::new(false));
    let thread_stop_signal = stop_signal.clone();

    {
        let mut ports = state.ports.lock().unwrap();
        ports.insert(
            port_name.clone(),
            PortEntry {
                port: port.try_clone().map_err(|e| e.to_string())?,
                stop_signal,
            },
        );
    }

    // Start a background thread to read from the port
    let mut reader = port;
    let p_name = port_name.clone();

    std::thread::spawn(move || {
        let mut serial_buf: Vec<u8> = vec![0; 1024];

        loop {
            if thread_stop_signal.load(Ordering::SeqCst) {
                break;
            }

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

    if let Some(entry) = ports.remove(&port_name) {
        entry.stop_signal.store(true, Ordering::SeqCst);
    }
}

#[tauri::command]
fn write_serial(state: State<'_, SerialState>, port_name: String, data: String) -> Result<(), String> {
    let mut ports = state.ports.lock().unwrap();

    if let Some(entry) = ports.get_mut(&port_name) {
        entry.port.write_all(data.as_bytes()).map_err(|e| e.to_string())?;

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
fn start_simulation(state: State<'_, SerialState>, app: AppHandle, path: String) -> Result<(), String> {
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
        let mut last_timestamp: Option<f64> = None;

        for line in reader.lines() {
            if !running.load(Ordering::SeqCst) {
                break;
            }

            if let Ok(content) = line {
                let columns: Vec<&str> = content.split(",").collect();

                if columns.len() < 4 {
                    continue;
                }

                let timestamp: f64 = columns.first()
                    .and_then(|s| s.parse::<f64>().ok())
                    .unwrap_or(0.0) * 1000.0;

                let payload = serde_json::json!({
                    "port": "SIMULATION",
                    "data": format!("{}\n", content)
                });

                let _ = app.emit("serial-data", payload);

                if let Some(last) = last_timestamp {
                    let delay = (timestamp - last).max(0.0) as u64;

                    if delay > 0 {
                        std::thread::sleep(std::time::Duration::from_millis(delay));
                    }
                }

                last_timestamp = Some(timestamp);
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

#[tauri::command]
fn redis_subscribe(
    state: State<'_, SerialState>,
    app: AppHandle,
    host: String,
    port: u16,
    channel: String,
) -> Result<(), String> {
    let sub_key = format!("{}:{}:{}", host, port, channel);

    {
        let subs = state.redis_subscriptions.lock().unwrap();

        if subs.contains_key(&sub_key) {
            return Ok(());
        }
    }

    let stop_signal = Arc::new(AtomicBool::new(false));
    let thread_stop_signal = stop_signal.clone();

    {
        let mut subs = state.redis_subscriptions.lock().unwrap();
        subs.insert(sub_key.clone(), RedisSubscriptionEntry { stop_signal });
    }

    let client = redis::Client::open(format!("redis://{}:{}/", host, port))
        .map_err(|e| e.to_string())?;

    let h = host.clone();
    let p = port;
    let c = channel.clone();

    std::thread::spawn(move || {
        let mut con = match client.get_connection() {
            Ok(c) => c,
            Err(_) => return,
        };

        if let Err(_) = con.set_read_timeout(Some(std::time::Duration::from_millis(100))) {
            return;
        }

        let mut pubsub = con.as_pubsub();

        if let Err(_) = pubsub.subscribe(&c) {
            return;
        }

        loop {
            if thread_stop_signal.load(Ordering::SeqCst) {
                break;
            }

            match pubsub.get_message() {
                Ok(msg) => {
                    if let Ok(payload) = msg.get_payload::<String>() {
                        let event_payload = serde_json::json!({
                            "host": h,
                            "port": p,
                            "channel": c,
                            "message": payload
                        });

                        let _ = app.emit("redis-message", event_payload);
                    }
                }
                Err(e) => {
                    if e.kind() == redis::ErrorKind::IoError {
                        // This might be a timeout, which is what we want to check the stop signal
                        continue;
                    }

                    // For other errors, we might want to break or log
                    break;
                }
            }
        }
    });

    Ok(())
}

#[tauri::command]
fn redis_unsubscribe(state: State<'_, SerialState>, host: String, port: u16, channel: String) {
    let sub_key = format!("{}:{}:{}", host, port, channel);
    let mut subs = state.redis_subscriptions.lock().unwrap();

    if let Some(entry) = subs.remove(&sub_key) {
        entry.stop_signal.store(true, Ordering::SeqCst);
    }
}

#[tauri::command]
fn redis_publish(host: String, port: u16, channel: String, message: String) -> Result<(), String> {
    let client = redis::Client::open(format!("redis://{}:{}/", host, port))
        .map_err(|e| e.to_string())?;

    let mut con = client.get_connection().map_err(|e| e.to_string())?;

    redis::cmd("PUBLISH")
        .arg(channel)
        .arg(message)
        .exec(&mut con)
        .unwrap();

    Ok(())
}

#[tauri::command]
fn write_osc(host_port: String, address: String, value: String) -> Result<(), String> {
    use std::net::ToSocketAddrs;

    let addrs = host_port.to_socket_addrs().map_err(|e| format!("Invalid host/port: {}", e))?;
    let target_addr = addrs.into_iter().next().ok_or("Could not resolve host")?;

    let bind_addr = if target_addr.is_ipv4() {
        "0.0.0.0:0"
    } else {
        "[::]:0"
    };

    let socket = std::net::UdpSocket::bind(bind_addr).map_err(|e| format!("Failed to bind socket: {}", e))?;

    // Intelligently parse value to use appropriate OSC types
    let osc_args: Vec<rosc::OscType> = value.split(',')
        .map(|s| {
            let s = s.trim();

            if let Ok(i) = s.parse::<i32>() {
                rosc::OscType::Int(i)
            } else if let Ok(f) = s.parse::<f32>() {
                rosc::OscType::Float(f)
            } else {
                rosc::OscType::String(s.to_string())
            }
        })
        .collect();

    let msg = rosc::OscPacket::Message(rosc::OscMessage {
        addr: if address.starts_with('/') { address } else { format!("/{}", address) },
        args: osc_args,
    });

    let packet = rosc::encoder::encode(&msg).map_err(|e| format!("OSC encoding error: {:?}", e))?;
    socket.send_to(&packet, &target_addr).map_err(|e| format!("Network error (OS Error {}): {}", e.raw_os_error().unwrap_or(0), e))?;

    Ok(())
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

            let edit_menu = SubmenuBuilder::new(app, "Edit")
                .undo()
                .redo()
                .separator()
                .cut()
                .copy()
                .paste()
                .select_all()
                .build()?;

            let menu = MenuBuilder::new(app)
                .items(&[&submenu, &edit_menu])
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
            redis_subscriptions: Mutex::new(HashMap::new()),
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
            append_to_file,
            redis_publish,
            redis_subscribe,
            redis_unsubscribe,
            write_osc
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application")
}
