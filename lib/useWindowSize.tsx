import {useEffect, useState} from 'react';

export interface WindowSize {
    width?: number,
    height?: number
}

// Hook
export function useWindowSize(): WindowSize {
    const isClient = typeof window === 'object';


    function getSize() {
        return {
            width: isClient ? window.innerWidth : undefined,
            height: isClient ? window.innerHeight : undefined
        };
    }

    const [windowSize, setWindowSize] = useState<WindowSize>(getSize);

    useEffect(() => {
        if (!isClient) {
            return;
        }

        function handleResize() {
            setWindowSize(getSize());
        }

        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []); // Empty array ensures that effect is only run on mount and unmount

    return windowSize;
}
