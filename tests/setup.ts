import "@testing-library/jest-dom/vitest";

// Stub ResizeObserver (jsdom doesn't ship it; not used by these tests, but silences noise)
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
  (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver || ResizeObserver;
