import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: string;
    fullPage?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    color = '#3b82f6',
    fullPage = false,
}) => {
    // Określ rozmiar w pikselach
    const sizeInPixels = {
        sm: 16,
        md: 32,
        lg: 48,
    }[size];

    const spinner = (
        <div
            style={{
                width: sizeInPixels,
                height: sizeInPixels,
                borderRadius: '50%',
                border: `${sizeInPixels / 8}px solid ${color}`,
                borderTopColor: 'transparent',
                animation: 'spin 1s linear infinite',
            }}
            className="loading-spinner"
        />
    );

    // Dodaj globalną regułę CSS dla animacji
    if (!document.getElementById('spinner-style')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'spinner-style';
        styleEl.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
        document.head.appendChild(styleEl);
    }

    if (fullPage) {
        return (
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    zIndex: 9999,
                }}
            >
                {spinner}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            {spinner}
        </div>
    );
};

export default LoadingSpinner;