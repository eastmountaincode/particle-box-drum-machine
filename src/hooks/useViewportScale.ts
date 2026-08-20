'use client'

import { useEffect, useRef, useState } from 'react';

interface ViewportDimensions {
    width: number;
    height: number;
}

interface ScaledViewport {
    containerRef: React.RefObject<HTMLDivElement | null>;
    isReady: boolean;
    scale: number;
    logicalWidth: number;
    logicalHeight: number;
    offsetX: number;
    offsetY: number;
}

interface ViewportScaleOptions {
    allowNarrowWidth?: boolean;
}

export function useViewportScale(
    minimumWidth: number,
    minimumHeight: number,
    { allowNarrowWidth = false }: ViewportScaleOptions = {}
): ScaledViewport {
    const containerRef = useRef<HTMLDivElement>(null);
    const [viewport, setViewport] = useState<ViewportDimensions>({ width: 0, height: 0 });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let animationFrame = 0;

        const updateViewport = (width: number, height: number) => {
            cancelAnimationFrame(animationFrame);
            animationFrame = requestAnimationFrame(() => {
                setViewport((current) => {
                    if (Math.abs(current.width - width) < 0.5 && Math.abs(current.height - height) < 0.5) {
                        return current;
                    }
                    return { width, height };
                });
            });
        };

        const observer = new ResizeObserver(([entry]) => {
            updateViewport(entry.contentRect.width, entry.contentRect.height);
        });

        const initialBounds = container.getBoundingClientRect();
        updateViewport(initialBounds.width, initialBounds.height);
        observer.observe(container);

        return () => {
            cancelAnimationFrame(animationFrame);
            observer.disconnect();
        };
    }, []);

    const isReady = viewport.width > 0 && viewport.height > 0;
    const needsFixedLayoutScaling = isReady
        && (viewport.width < minimumWidth || viewport.height < minimumHeight);
    const scale = !isReady
        ? 1
        : allowNarrowWidth
        ? Math.min(1, viewport.height / minimumHeight)
        : needsFixedLayoutScaling
            ? Math.min(viewport.width / minimumWidth, viewport.height / minimumHeight)
            : 1;
    const logicalWidth = !isReady
        ? minimumWidth
        : allowNarrowWidth
        ? viewport.width / scale
        : needsFixedLayoutScaling ? minimumWidth : viewport.width;
    const logicalHeight = !isReady
        ? minimumHeight
        : allowNarrowWidth
        ? viewport.height / scale
        : needsFixedLayoutScaling ? minimumHeight : viewport.height;
    const renderedWidth = logicalWidth * scale;
    const renderedHeight = logicalHeight * scale;

    return {
        containerRef,
        isReady,
        scale,
        logicalWidth,
        logicalHeight,
        offsetX: isReady && !allowNarrowWidth ? Math.max(0, (viewport.width - renderedWidth) / 2) : 0,
        offsetY: isReady && !allowNarrowWidth ? Math.max(0, (viewport.height - renderedHeight) / 2) : 0,
    };
}
