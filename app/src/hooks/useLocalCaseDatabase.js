import { useEffect, useMemo, useState } from "react";
import {
  getCachedLocalCaseDatabase,
  loadLocalCaseDatabase,
} from "../data/localCaseDatabase";

export default function useLocalCaseDatabase() {
  const [casesById, setCasesById] = useState(() => getCachedLocalCaseDatabase() || {});
  const [isLoading, setIsLoading] = useState(() => !getCachedLocalCaseDatabase());
  const [error, setError] = useState(null);

  useEffect(() => {
    if (getCachedLocalCaseDatabase()) return undefined;

    let cancelled = false;

    loadLocalCaseDatabase()
      .then((nextCasesById) => {
        if (cancelled) return;
        setCasesById(nextCasesById);
        setIsLoading(false);
      })
      .catch((nextError) => {
        if (cancelled) return;
        setError(nextError instanceof Error ? nextError.message : "Could not load local case database.");
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const caseEntries = useMemo(() => Object.entries(casesById), [casesById]);

  return {
    casesById,
    caseEntries,
    caseCount: caseEntries.length,
    error,
    isLoading,
  };
}
