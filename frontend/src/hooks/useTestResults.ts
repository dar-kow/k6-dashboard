import { useEffect, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "../store";
import {
  selectDirectories,
  selectDirectoriesLoading,
  selectDirectoriesError,
  selectSelectedDirectory,
  selectLatestResults,
  selectLatestResultsLoading,
  fetchDirectoriesStart,
  fetchLatestResultsStart,
  setSelectedDirectory,
} from "../store/slices/testResultsSlice";

export const useTestResults = () => {
  const dispatch = useAppDispatch();

  // Selectors
  const directories = useAppSelector(selectDirectories);
  const loading = useAppSelector(selectDirectoriesLoading);
  const error = useAppSelector(selectDirectoriesError);
  const selectedDirectory = useAppSelector(selectSelectedDirectory);
  const latestResults = useAppSelector(selectLatestResults);
  const latestResultsLoading = useAppSelector(selectLatestResultsLoading);

  // Actions
  const refreshData = useCallback(() => {
    dispatch(fetchDirectoriesStart());
  }, [dispatch]);

  const selectTestRun = useCallback(
    (directory: string | null) => {
      dispatch(setSelectedDirectory(directory));
    },
    [dispatch]
  );

  const refreshLatestResults = useCallback(() => {
    dispatch(fetchLatestResultsStart());
  }, [dispatch]);

  // Auto-load on mount
  useEffect(() => {
    if (directories.length === 0 && !loading) {
      refreshData();
    }
  }, [directories.length, loading, refreshData]);

  // Auto-select first directory
  useEffect(() => {
    if (directories.length > 0 && !selectedDirectory) {
      selectTestRun(directories[0].name);
    }
  }, [directories, selectedDirectory, selectTestRun]);

  // Auto-load latest results when selected directory changes
  useEffect(() => {
    if (selectedDirectory) {
      refreshLatestResults();
    }
  }, [selectedDirectory, refreshLatestResults]);

  return {
    directories,
    loading,
    error,
    selectedDirectory,
    latestResults,
    latestResultsLoading,
    refreshData,
    selectTestRun,
    refreshLatestResults,
  };
};
