import { useEffect, useRef, useState } from "react";

export function useAutosave<T>(value: T, save: (v: T) => Promise<void> | void, delay = 800) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const first = useRef(true);
  const lastSaved = useRef(JSON.stringify(value));

  useEffect(() => {
    if (first.current) {
      first.current = false;
      lastSaved.current = JSON.stringify(value);
      return;
    }
    const serialized = JSON.stringify(value);
    if (serialized === lastSaved.current) return;

    setStatus("saving");
    const t = setTimeout(async () => {
      try {
        await save(value);
        lastSaved.current = serialized;
        setStatus("saved");
        setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 1500);
      } catch {
        setStatus("error");
      }
    }, delay);
    return () => clearTimeout(t);
  }, [value, delay, save]);

  return status;
}
