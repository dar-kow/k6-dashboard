import React, { useEffect } from 'react';
import { useAppDispatch } from '../hooks';
import { fetchRepositoriesRequest } from '../store/slices/repositories.slice';
import { fetchDirectoriesRequest } from '../store/slices/testResults.slice';

interface MigrationWrapperProps {
    children: React.ReactNode;
}

/**
 * MigrationWrapper - komponent który inicjalizuje Redux state
 * i umożliwia stopniowe przejście z Context API do Redux
 */
const MigrationWrapper: React.FC<MigrationWrapperProps> = ({ children }) => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        console.log('🔄 MigrationWrapper: Initializing Redux state...');

        // Initialize repositories on app start
        dispatch(fetchRepositoriesRequest());

        // Initialize test results (will use selected repository from Redux state)
        dispatch(fetchDirectoriesRequest({}));

    }, [dispatch]);

    return <>{children}</>;
};

export default MigrationWrapper;