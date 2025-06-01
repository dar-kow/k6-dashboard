import { useSelector, useDispatch } from "react-redux";
import { useCallback, useMemo } from "react";
import { RootState } from "@/store";
import {
  fetchDirectoriesRequest,
  setSelectedDirectory,
  fetchFilesRequest,
  setSelectedFile,
  refreshTestResults,
} from "@/store/slices/testResultsSlice";
import { TestDirectory, TestFile, TestResult } from "@/types/testResults";

export const useTestResults = () => {
  const dispatch = useDispatch();

  // Selektory dla danych z Redux
  const {
    directories,
    selectedDirectory,
    files,
    selectedFile,
    selectedTestResult,
    loading,
    error,
  } = useSelector((state: RootState) => state.testResults);

  const selectedRepository = useSelector(
    (state: RootState) => state.repositories.selectedRepository
  );

  // Zmemoizowane akcje
  const fetchDirectories = useCallback(() => {
    dispatch(fetchDirectoriesRequest(selectedRepository?.id));
  }, [dispatch, selectedRepository?.id]);

  const selectDirectory = useCallback(
    (directory: string | null) => {
      dispatch(setSelectedDirectory(directory));
    },
    [dispatch]
  );

  const fetchFiles = useCallback(
    (directory: string) => {
      dispatch(fetchFilesRequest(directory));
    },
    [dispatch]
  );

  const selectFile = useCallback(
    (file: string | null) => {
      dispatch(setSelectedFile(file));
    },
    [dispatch]
  );

  const refreshData = useCallback(() => {
    dispatch(refreshTestResults());
  }, [dispatch]);

  // Zmemoizowane przetworzone dane
  const sortedDirectories = useMemo(() => {
    return [...directories].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [directories]);

  const latestDirectory = useMemo(() => {
    return sortedDirectories.length > 0 ? sortedDirectories[0] : null;
  }, [sortedDirectories]);

  return {
    directories: sortedDirectories,
    selectedDirectory,
    files,
    selectedFile,
    selectedTestResult,
    latestDirectory,
    loading,
    error,
    fetchDirectories,
    selectDirectory,
    fetchFiles,
    selectFile,
    refreshData,
  };
};
