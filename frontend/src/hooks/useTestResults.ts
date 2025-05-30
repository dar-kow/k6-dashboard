import { useCallback, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "./useAppSelector";
import {
  fetchDirectoriesStart,
  setSelectedDirectory,
  setSelectedFile,
} from "../store/slices/testResultsSlice";

export const useTestResults = (repositoryId?: string) => {
  const dispatch = useAppDispatch();

  const {
    directories,
    selectedDirectory,
    files,
    selectedFile,
    testResult,
    loading,
    error,
  } = useAppSelector((state) => state.testResults);

  const fetchDirectories = useCallback(() => {
    dispatch(fetchDirectoriesStart(repositoryId));
  }, [dispatch, repositoryId]);

  const selectDirectory = useCallback(
    (directory: string | null) => {
      dispatch(setSelectedDirectory(directory));
    },
    [dispatch]
  );

  const selectFile = useCallback(
    (file: string | null) => {
      dispatch(setSelectedFile(file));
    },
    [dispatch]
  );

  useEffect(() => {
    fetchDirectories();
  }, [fetchDirectories]);

  return {
    directories,
    selectedDirectory,
    files,
    selectedFile,
    testResult,
    loading,
    error,
    actions: {
      fetchDirectories,
      selectDirectory,
      selectFile,
    },
  };
};
