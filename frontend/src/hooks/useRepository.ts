import { useEffect, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "../store";
import {
  selectRepositories,
  selectRepositoriesLoading,
  selectSelectedRepository,
  selectSelectedRepositoryConfig,
  fetchRepositoriesStart,
  fetchConfigStart,
  setSelectedRepository,
  createRepositoryStart,
  syncRepositoryStart,
  deleteRepositoryStart,
} from "../store/slices/repositorySlice";
import { Repository, CreateRepositoryRequest } from "../api/repositories";

export const useRepository = () => {
  const dispatch = useAppDispatch();

  // Selectors
  const repositories = useAppSelector(selectRepositories);
  const loading = useAppSelector(selectRepositoriesLoading);
  const selectedRepository = useAppSelector(selectSelectedRepository);
  const selectedRepositoryConfig = useAppSelector(
    selectSelectedRepositoryConfig
  );

  // Actions
  const refreshRepositories = useCallback(() => {
    dispatch(fetchRepositoriesStart());
  }, [dispatch]);

  const selectRepo = useCallback(
    (repository: Repository | null) => {
      dispatch(setSelectedRepository(repository));
      if (repository) {
        dispatch(fetchConfigStart(repository.id));
      }
    },
    [dispatch]
  );

  const createRepo = useCallback(
    (data: CreateRepositoryRequest) => {
      dispatch(createRepositoryStart(data));
    },
    [dispatch]
  );

  const syncRepo = useCallback(
    (repositoryId: string) => {
      dispatch(syncRepositoryStart(repositoryId));
    },
    [dispatch]
  );

  const deleteRepo = useCallback(
    (repositoryId: string) => {
      dispatch(deleteRepositoryStart(repositoryId));
    },
    [dispatch]
  );

  // Auto-load on mount
  useEffect(() => {
    if (repositories.length === 0 && !loading) {
      refreshRepositories();
    }
  }, [repositories.length, loading, refreshRepositories]);

  // Restore selected repository from localStorage
  useEffect(() => {
    const savedRepoId = localStorage.getItem("selectedRepositoryId");
    if (savedRepoId && repositories.length > 0 && !selectedRepository) {
      const savedRepo = repositories.find((r) => r.id === savedRepoId);
      if (savedRepo) {
        selectRepo(savedRepo);
      }
    }
  }, [repositories, selectedRepository, selectRepo]);

  return {
    repositories,
    loading,
    selectedRepository,
    selectedRepositoryConfig,
    refreshRepositories,
    selectRepo,
    createRepo,
    syncRepo,
    deleteRepo,
  };
};
