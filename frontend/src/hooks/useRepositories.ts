import { useCallback, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "./useAppSelector";
import {
  fetchRepositoriesStart,
  setSelectedRepository,
  createRepositoryStart,
  syncRepositoryStart,
  deleteRepositoryStart,
} from "@store/slices/repositoriesSlice";
import { CreateRepositoryRequest } from "@services/repositoriesApi";

export const useRepositories = () => {
  const dispatch = useAppDispatch();

  const {
    repositories,
    selectedRepository,
    selectedRepositoryConfig,
    loading,
    error,
  } = useAppSelector((state) => state.repositories);

  const fetchRepositories = useCallback(() => {
    dispatch(fetchRepositoriesStart());
  }, [dispatch]);

  const selectRepository = useCallback(
    (repository: any) => {
      dispatch(setSelectedRepository(repository));
    },
    [dispatch]
  );

  const createRepository = useCallback(
    (data: CreateRepositoryRequest) => {
      dispatch(createRepositoryStart(data));
    },
    [dispatch]
  );

  const syncRepository = useCallback(
    (repositoryId: string) => {
      dispatch(syncRepositoryStart(repositoryId));
    },
    [dispatch]
  );

  const deleteRepository = useCallback(
    (repositoryId: string) => {
      dispatch(deleteRepositoryStart(repositoryId));
    },
    [dispatch]
  );

  useEffect(() => {
    if (repositories.length === 0) {
      fetchRepositories();
    }
  }, [fetchRepositories, repositories.length]);

  return {
    repositories,
    selectedRepository,
    selectedRepositoryConfig,
    loading,
    error,
    actions: {
      fetchRepositories,
      selectRepository,
      createRepository,
      syncRepository,
      deleteRepository,
    },
  };
};
