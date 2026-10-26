type Listener = () => void;
const endedListeners = new Set<Listener>();

export function notifySessionEnded(): void {
  endedListeners.forEach((listener) => listener());
}

export function onSessionEnded(listener: Listener): () => void {
  endedListeners.add(listener);
  return () => {
    endedListeners.delete(listener);
  };
}
