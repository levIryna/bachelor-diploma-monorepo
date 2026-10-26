type Listener = () => void;
const endedListeners = new Set<Listener>();
const AUTH_CHANNEL = 'procurement-auth';

export function notifySessionEnded(): void {
  endedListeners.forEach((listener) => listener());
}

export function onSessionEnded(listener: Listener): () => void {
  endedListeners.add(listener);
  return () => {
    endedListeners.delete(listener);
  };
}

export function notifyAuthChanged(): void {
  if (typeof BroadcastChannel === 'undefined') return;
  const channel = new BroadcastChannel(AUTH_CHANNEL);
  channel.postMessage('changed');
  channel.close();
}

export function onAuthChanged(listener: Listener): () => void {
  if (typeof BroadcastChannel === 'undefined') return () => undefined;
  const channel = new BroadcastChannel(AUTH_CHANNEL);
  channel.onmessage = () => listener();
  return () => channel.close();
}
