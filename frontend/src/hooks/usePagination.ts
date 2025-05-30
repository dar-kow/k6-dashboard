import { useState, useMemo, useCallback } from "react";

interface UsePaginationProps {
  totalItems: number;
  itemsPerPage: number;
  initialPage?: number;
}

export const usePagination = ({
  totalItems,
  itemsPerPage,
  initialPage = 1,
}: UsePaginationProps) => {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    return {
      totalPages,
      startIndex,
      endIndex,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }, [totalItems, itemsPerPage, currentPage]);

  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, paginationData.totalPages));
      setCurrentPage(validPage);
    },
    [paginationData.totalPages]
  );

  const nextPage = useCallback(() => {
    if (paginationData.hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [paginationData.hasNextPage]);

  const previousPage = useCallback(() => {
    if (paginationData.hasPreviousPage) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [paginationData.hasPreviousPage]);

  return {
    currentPage,
    ...paginationData,
    actions: {
      goToPage,
      nextPage,
      previousPage,
    },
  };
};
