import { useEffect, useMemo, useState } from "react";
import {
  CasesById,
  getCachedLocalCaseDatabase,
  loadLocalCaseDatabase,
} from "../data/localCaseDatabase";
import { CaseRecord } from "../data/sampleCases";

export interface UseLocalCaseDatabaseResult {
  casesById: CasesById;
  caseEntries: [string, CaseRecord][];
  caseCount: number;
  error: string | null;
  isLoading: boolean;
}

export default function useLocalCaseDatabase(): UseLocalCaseDatabaseResult {
  const [casesById, setCasesById] = useState<CasesById>(() => getCachedLocalCaseDatabase() || {});
  const [isLoading, setIsLoading] = useState<boolean>(() => !getCachedLocalCaseDatabase());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (getCachedLocalCaseDatabase()) return undefined;

    let cancelled = false;

    loadLocalCaseDatabase()
      .then((nextCasesById) => {
        if (cancelled) return;
        setCasesById(nextCasesById);
        setIsLoading(false);
      })
      .catch((nextError: unknown) => {
        if (cancelled) return;
        setError(nextError instanceof Error ? nextError.message : "Could not load local case database.");
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const caseEntries = useMemo(() => Object.entries(casesById) as [string, CaseRecord][], [casesById]);

  return {
    casesById,
    caseEntries,
    caseCount: caseEntries.length,
    error,
    isLoading,
  };
}
