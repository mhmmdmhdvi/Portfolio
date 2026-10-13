import { useCallback, useEffect, useState } from "react";

export function useFiles(path) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/files?path=${encodeURIComponent(path)}`, {
      signal: controller.signal,
      credentials: "same-origin",
    })
      .then((response) => {
        if (!response.ok) throw new Error("Couldn't open this folder.");
        return response.json();
      })
      .then((data) => {
        setFiles(Array.isArray(data.files) ? data.files : []);
        setLoading(false);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setFiles([]);
          setError(error.message);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [path, revision]);
  return { files, loading, error, refresh };
}
