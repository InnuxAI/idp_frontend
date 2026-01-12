
import { useEffect, useState } from 'react';

export const useResizeObserver = (ref: React.RefObject<HTMLElement | null>) => {
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
    useEffect(() => {
        const observeTarget = ref.current;
        if (!observeTarget) return;
        const resizeObserver = new ResizeObserver((entries) => {
            entries.forEach((entry) => {
                setDimensions(entry.contentRect);
            });
        });
        resizeObserver.observe(observeTarget);
        return () => {
            resizeObserver.unobserve(observeTarget);
        };
    }, [ref]);
    return dimensions;
};
