import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "./index";
import {
  Repository,
  RepositoryConfig,
  CreateRepositoryRequest,
} from "../api/repositories";

// Test Results hooks (replacement for useTestResults)
import {
  selectDirectories,
  selectDirectoriesLoading,
  selectDirectoriesError,
  selectSelectedDirectory,
  selectLastRefreshTime,
  selectLatestDirectory,
  selectDirectoryByName,
  setSelectedDirectory,
  fetchDirectoriesRequest,
  refreshDataRequest,
} from "../store/slices/testResults.slice";

// Repositories hooks (replacement for useRepository)
import {
  selectRepositoriesList,
  selectRepositoriesLoading,
  selectRepositoriesError,
  selectSelectedRepository,
  selectSelectedRepositoryConfig,
  selectRepositoryConfigLoading,
  selectLastSyncTime,
  selectRepositoryById,
  setSelectedRepository as setSelectedRepo,
  fetchRepositoriesRequest,
  createRepositoryRequest,
  deleteRepositoryRequest,
  syncRepositoryRequest,
  fetchRepositoryConfigRequest,
} from "../store/slices/repositories.slice";

// UI hooks
import {
  selectLoading,
  selectNotifications,
  selectModal,
  selectTheme,
  showSuccessNotification,
  showErrorNotification,
  showWarningNotification,
  showInfoNotification,
  openModal,
  closeModal,
  setTheme,
} from "../store/slices/ui.slice";

// ================================
// TEST RESULTS HOOKS
// ================================

export const useTestResults = () => {
  const dispatch = useAppDispatch();

  // Selectors
  const directories = useAppSelector(selectDirectories);
  const loading = useAppSelector(selectDirectoriesLoading);
  const error = useAppSelector(selectDirectoriesError);
  const selectedDirectory = useAppSelector(selectSelectedDirectory);
  const lastRefreshTime = useAppSelector(selectLastRefreshTime);

  // Actions
  const setSelectedDir = useCallback(
    (directory: string | null) => {
      dispatch(setSelectedDirectory(directory));
    },
    [dispatch]
  );

  const refreshData = useCallback(
    async (repositoryId?: string) => {
      dispatch(refreshDataRequest(repositoryId ? { repositoryId } : {}));
    },
    [dispatch]
  );

  const fetchDirectories = useCallback(
    (repositoryId?: string) => {
      dispatch(fetchDirectoriesRequest(repositoryId ? { repositoryId } : {}));
    },
    [dispatch]
  );

  return {
    directories,
    loading,
    error,
    selectedDirectory,
    lastRefreshTime,
    setSelectedDirectory: setSelectedDir,
    refreshData,
    fetchDirectories,
  };
};

// Convenience hook for getting latest directory
export const useLatestDirectory = () => {
  return useAppSelector(selectLatestDirectory);
};

// Convenience hook for getting specific directory
export const useDirectoryByName = (directoryName: string) => {
  return useAppSelector(selectDirectoryByName(directoryName));
};

// ================================
// REPOSITORIES HOOKS
// ================================

export const useRepository = () => {
  const dispatch = useAppDispatch();

  // Selectors
  const repositories = useAppSelector(selectRepositoriesList);
  const loading = useAppSelector(selectRepositoriesLoading);
  const error = useAppSelector(selectRepositoriesError);
  const selectedRepository = useAppSelector(selectSelectedRepository);
  const selectedRepositoryConfig = useAppSelector(
    selectSelectedRepositoryConfig
  );
  const configLoading = useAppSelector(selectRepositoryConfigLoading);
  const lastSyncTime = useAppSelector(selectLastSyncTime);

  // Actions
  const selectRepository = useCallback(
    (repository: Repository | null) => {
      dispatch(setSelectedRepo(repository));
    },
    [dispatch]
  );

  const refreshRepositories = useCallback(async () => {
    dispatch(fetchRepositoriesRequest());
  }, [dispatch]);

  const createRepo = useCallback(
    async (data: CreateRepositoryRequest) => {
      dispatch(createRepositoryRequest(data));
    },
    [dispatch]
  );

  const deleteRepo = useCallback(
    async (repositoryId: string) => {
      dispatch(deleteRepositoryRequest(repositoryId));
    },
    [dispatch]
  );

  const syncRepo = useCallback(
    async (repositoryId: string) => {
      dispatch(syncRepositoryRequest(repositoryId));
    },
    [dispatch]
  );

  const refreshConfig = useCallback(async () => {
    if (selectedRepository) {
      dispatch(fetchRepositoryConfigRequest(selectedRepository.id));
    }
  }, [dispatch, selectedRepository]);

  return {
    repositories,
    selectedRepository,
    selectedRepositoryConfig,
    loading,
    configLoading,
    error,
    lastSyncTime,
    selectRepository,
    refreshRepositories,
    createRepository: createRepo,
    deleteRepository: deleteRepo,
    syncRepository: syncRepo,
    refreshConfig,
  };
};

// Convenience hook for getting repository by ID
export const useRepositoryById = (repositoryId: string) => {
  return useAppSelector(selectRepositoryById(repositoryId));
};

// ================================
// UI HOOKS
// ================================

export const useUIState = () => {
  const dispatch = useAppDispatch();

  // Selectors
  const loading = useAppSelector(selectLoading);
  const notifications = useAppSelector(selectNotifications);
  const modal = useAppSelector(selectModal);
  const theme = useAppSelector(selectTheme);

  // Actions
  const showSuccess = useCallback(
    (title: string, message?: string) => {
      dispatch(showSuccessNotification(title, message));
    },
    [dispatch]
  );

  const showError = useCallback(
    (title: string, message?: string) => {
      dispatch(showErrorNotification(title, message));
    },
    [dispatch]
  );

  const showWarning = useCallback(
    (title: string, message?: string) => {
      dispatch(showWarningNotification(title, message));
    },
    [dispatch]
  );

  const showInfo = useCallback(
    (title: string, message?: string) => {
      dispatch(showInfoNotification(title, message));
    },
    [dispatch]
  );

  const openModalDialog = useCallback(
    (type: string, data?: any) => {
      dispatch(openModal({ type, data }));
    },
    [dispatch]
  );

  const closeModalDialog = useCallback(() => {
    dispatch(closeModal());
  }, [dispatch]);

  const changeTheme = useCallback(
    (newTheme: "light" | "dark") => {
      dispatch(setTheme(newTheme));
    },
    [dispatch]
  );

  return {
    loading,
    notifications,
    modal,
    theme,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    openModal: openModalDialog,
    closeModal: closeModalDialog,
    setTheme: changeTheme,
  };
};

// ================================
// NOTIFICATION HOOKS
// ================================

export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);

  const showSuccess = useCallback(
    (title: string, message?: string) => {
      dispatch(showSuccessNotification(title, message));
    },
    [dispatch]
  );

  const showError = useCallback(
    (title: string, message?: string) => {
      dispatch(showErrorNotification(title, message));
    },
    [dispatch]
  );

  const showWarning = useCallback(
    (title: string, message?: string) => {
      dispatch(showWarningNotification(title, message));
    },
    [dispatch]
  );

  const showInfo = useCallback(
    (title: string, message?: string) => {
      dispatch(showInfoNotification(title, message));
    },
    [dispatch]
  );

  return {
    notifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

// ================================
// LOADING HOOKS
// ================================

export const useLoadingStates = () => {
  const loading = useAppSelector(selectLoading);

  return {
    globalLoading: loading.globalLoading,
    testExecution: loading.testExecution,
    pdfGeneration: loading.pdfGeneration,
    apiRequests: loading.apiRequests,
    // Convenience methods
    hasAnyLoading:
      loading.globalLoading ||
      loading.testExecution ||
      loading.pdfGeneration ||
      Object.keys(loading.apiRequests).length > 0,
  };
};

// Re-export types for convenience
export type {
  Repository,
  RepositoryConfig,
  CreateRepositoryRequest,
} from "../api/repositories";
export type { TestDirectory } from "../types/testResults";
export type { Notification } from "../store/slices/ui.slice";
