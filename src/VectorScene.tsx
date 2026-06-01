/**
 * VectorScene — LUMINARA Remotion composition.
 * Renders a scaled vector illustration above a kinetic-text area driven
 * by a Whisper word-level transcript.
 *
 * The original snippet (provided by the user) imported `Interpolate` from
 * remotion but never used it; the import is omitted here to keep the file
 * warning-free. Add it back if you wire up a value-mapping chain later.
 */
import { useCurrentFrame, useVideoConfig, spring } from "remotion";

export type WhisperWord = {
  word: string;
  start: number; // seconds
  end: number;   // seconds
};

export function getCurrentWord(
  frame: number,
  words: WhisperWord[],
  fps: number,
): string {
  if (!words || words.length === 0) return "";
  const t = frame / fps;
  // Linear scan is fine for short captions. For >500 words, switch to
  // a binary search keyed off `start`.
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (t >= w.start && t < w.end) return w.word;
  }
  return "";
}

export const VectorScene: React.FC<{
  svgUrl: string;
  words: WhisperWord[];
}> = ({ svgUrl, words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Smooth entrance scale animation for the vector graphic
  const scale = spring({ frame, fps, config: { damping: 12 } });

  return (
    <div
      data-testid="vector-scene-root"
      style={{
        backgroundColor: "#0f172a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
      }}
    >
      {/* Dynamic Vector Illustration */}
      <img
        data-testid="vector-graphic"
        src={svgUrl}
        style={{ transform: `scale(${scale})`, width: 400, height: 400 }}
        alt=""
      />

      {/* Kinetic Text Area synced via Whisper */}
      <div
        data-testid="kinetic-text"
        style={{ marginTop: 50, fontSize: 64, color: "#fff", fontWeight: "bold" }}
      >
        {getCurrentWord(frame, words, fps)}
      </div>
    </div>
  );
};
