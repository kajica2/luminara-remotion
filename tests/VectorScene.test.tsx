/**
 * Tests for VectorScene.
 *
 * Strategy: remotion's `useCurrentFrame` and `useVideoConfig` are mocked
 * per-test so we can drive the composition deterministically. We then
 * assert the rendered DOM, the scale formula, and the word-time mapping.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// --- Mock remotion BEFORE importing the component under test ---
const mockUseCurrentFrame = vi.fn(() => 0);
const mockUseVideoConfig = vi.fn(() => ({ fps: 30, width: 1920, height: 1080 }));
const mockSpring = vi.fn(({ frame, fps }: { frame: number; fps: number }) => {
  // Tiny deterministic stand-in: linear 0..1 over 30 frames.
  // The real remotion spring is more complex; tests that care about its
  // exact curve should mock it explicitly per-test.
  void fps;
  return Math.min(1, frame / 30);
});

vi.mock("remotion", () => ({
  useCurrentFrame: () => mockUseCurrentFrame(),
  useVideoConfig: () => mockUseVideoConfig(),
  spring: (args: { frame: number; fps: number }) => mockSpring(args),
}));

import { VectorScene, getCurrentWord, type WhisperWord } from "../src/VectorScene";

const WORDS: WhisperWord[] = [
  { word: "luminara",   start: 0.0, end: 0.5 },
  { word: "is",         start: 0.5, end: 0.7 },
  { word: "awake",      start: 0.7, end: 1.1 },
  { word: "in",         start: 1.1, end: 1.2 },
  { word: "the",        start: 1.2, end: 1.35 },
  { word: "signal",     start: 1.35, end: 1.8 },
];

const SVG_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=";

beforeEach(() => {
  mockUseCurrentFrame.mockReturnValue(0);
  mockUseVideoConfig.mockReturnValue({ fps: 30, width: 1920, height: 1080 });
  mockSpring.mockImplementation(({ frame }) => Math.min(1, frame / 30));
});

describe("VectorScene", () => {
  it("renders the root, the graphic, and the kinetic text", () => {
    render(<VectorScene svgUrl={SVG_URL} words={WORDS} />);
    expect(screen.getByTestId("vector-scene-root")).toBeInTheDocument();
    expect(screen.getByTestId("vector-graphic")).toBeInTheDocument();
    expect(screen.getByTestId("kinetic-text")).toBeInTheDocument();
  });

  it("uses the supplied svgUrl on the <img>", () => {
    render(<VectorScene svgUrl={SVG_URL} words={WORDS} />);
    expect(screen.getByTestId("vector-graphic")).toHaveAttribute("src", SVG_URL);
  });

  it("passes frame and fps into spring()", () => {
    mockUseCurrentFrame.mockReturnValue(45);
    render(<VectorScene svgUrl={SVG_URL} words={WORDS} />);
    expect(mockSpring).toHaveBeenCalledWith(
      expect.objectContaining({ frame: 45, fps: 30 }),
    );
  });

  it("applies scale() to the vector graphic with the spring value", () => {
    mockSpring.mockReturnValue(0.42);
    render(<VectorScene svgUrl={SVG_URL} words={WORDS} />);
    const img = screen.getByTestId("vector-graphic");
    expect(img).toHaveStyle({ transform: "scale(0.42)" });
  });

  it("displays the word whose [start, end) interval contains frame/fps", () => {
    // frame 21 at fps 30  ->  t = 0.7s  ->  "awake"
    mockUseCurrentFrame.mockReturnValue(21);
    render(<VectorScene svgUrl={SVG_URL} words={WORDS} />);
    expect(screen.getByTestId("kinetic-text")).toHaveTextContent("awake");
  });

  it("displays an empty string when no words are provided", () => {
    render(<VectorScene svgUrl={SVG_URL} words={[]} />);
    expect(screen.getByTestId("kinetic-text")).toHaveTextContent("");
  });

  it("displays an empty string when the time is past the last word", () => {
    // frame 999 at fps 30 -> t = 33.3s, well past 1.8s
    mockUseCurrentFrame.mockReturnValue(999);
    render(<VectorScene svgUrl={SVG_URL} words={WORDS} />);
    expect(screen.getByTestId("kinetic-text")).toHaveTextContent("");
  });

  it("honors different fps values from useVideoConfig", () => {
    mockUseVideoConfig.mockReturnValue({ fps: 60, width: 1920, height: 1080 });
    // frame 42 at fps 60 -> t = 0.7s -> "awake"
    mockUseCurrentFrame.mockReturnValue(42);
    render(<VectorScene svgUrl={SVG_URL} words={WORDS} />);
    expect(screen.getByTestId("kinetic-text")).toHaveTextContent("awake");
  });
});

describe("getCurrentWord (unit)", () => {
  it("returns the matching word at the midpoint of its range", () => {
    // t=0.25s -> "luminara"
    expect(getCurrentWord(0.25 * 30, WORDS, 30)).toBe("luminara");
    // t=0.6s -> "is"
    expect(getCurrentWord(0.6 * 30, WORDS, 30)).toBe("is");
  });

  it("returns empty string for empty word list", () => {
    expect(getCurrentWord(0, [], 30)).toBe("");
  });

  it("returns empty string when t is before the first word", () => {
    // t = -1  -> nothing
    expect(getCurrentWord(-30, WORDS, 30)).toBe("");
  });

  it("returns empty string when t is after the last word", () => {
    // t = 100s -> past 1.8s
    expect(getCurrentWord(100 * 30, WORDS, 30)).toBe("");
  });

  it("uses [start, end) intervals (boundary at end belongs to the next word)", () => {
    // t = 0.65s -> "is" (strictly inside [0.5, 0.7))
    expect(getCurrentWord(0.65 * 30, WORDS, 30)).toBe("is");
    // t = 0.7000001s -> "awake" (end of "is" is exclusive)
    expect(getCurrentWord(0.7000001 * 30, WORDS, 30)).toBe("awake");
  });
});
