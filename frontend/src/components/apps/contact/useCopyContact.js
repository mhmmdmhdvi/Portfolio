import { useState } from "react";

export function useCopyContact() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState(null);

  async function copy(channel) {
    setPending(true);
    setResult(null);
    try {
      await navigator.clipboard.writeText(channel.copyValue);
      setResult({ id: channel.id, status: "success" });
    } catch {
      setResult({ id: channel.id, status: "error" });
    } finally {
      setPending(false);
    }
  }

  return { copy, pending, result };
}
