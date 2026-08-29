// Lets the axios interceptor (a plain module, outside React) notify AuthContext
// when a refresh attempt fails so the app can drop back to a logged-out state.
type Listener = () => void;

let listener: Listener | null = null;

export function onSessionExpired(fn: Listener): void {
  listener = fn;
}

export function emitSessionExpired(): void {
  listener?.();
}
