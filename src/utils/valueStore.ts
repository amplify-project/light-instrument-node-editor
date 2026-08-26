type Listener = (value: any) => void;

class ValueStore {
  private listeners: Record<string, Set<Listener>> = {};
  private values: Record<string, any> = {};

  store(name: string, value: any) {
    this.values[name] = value;

    if (this.listeners[name]) {
      this.listeners[name].forEach((l) => l(value));
    }
  }

  subscribe(name: string, listener: Listener) {
    if (!this.listeners[name]) {
      this.listeners[name] = new Set();
    }

    this.listeners[name].add(listener);
    return () => this.listeners[name].delete(listener);
  }

  getValue(name: string) {
    return this.values[name];
  }
}

export const valueStore = new ValueStore();
