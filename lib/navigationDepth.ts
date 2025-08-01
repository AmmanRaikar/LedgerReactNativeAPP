// lib/navigationDepth.ts
let depth = 0;
const listeners = new Set<(depth: number) => void>();

export function getDepth() {
  return depth;
}

export function incrementDepth() {
  depth++;
  notify();
}

export function decrementDepth() {
  depth = Math.max(0, depth - 1);
  notify();
}

export function subscribe(callback: (depth: number) => void) {
  listeners.add(callback);
  return () => listeners.delete(callback); // unsubscribe function
}

function notify() {
  listeners.forEach((cb) => cb(depth));
}
