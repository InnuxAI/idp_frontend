
import { useEffect, useState, useCallback, RefObject } from 'react';

export const useResizeObserver = (ref: RefObject<HTMLElement | null>) => {
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

    useEffect(() => {
        const observeTarget = ref.current;
        if (!observeTarget) return;

        const resizeObserver = new ResizeObserver((entries) => {
            entries.forEach((entry) => {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            });
        });

        resizeObserver.observe(observeTarget);

        // Get initial dimensions
        const rect = observeTarget.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });

        return () => {
            resizeObserver.disconnect();
        };
    }, [ref.current]); // Depend on ref.current, not ref

    return dimensions;
};
