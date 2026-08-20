'use client'

import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from 'react';

interface AppModalProps {
    children: ReactNode;
    isOpen: boolean;
    onClose: () => void;
    title: string;
    testId?: string;
}

export const appModalTriggerClass =
    'cursor-pointer border border-white border-opacity-50 bg-black px-3 py-2 text-xs text-white hover:bg-white hover:text-black';

const FOCUSABLE_SELECTOR = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

export function AppModal({ children, isOpen, onClose, title, testId }: AppModalProps) {
    const titleId = useId();
    const overlayRef = useRef<HTMLDivElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const previouslyFocused = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        const inertedElements: Array<{
            element: HTMLElement;
            inert: boolean;
            ariaHidden: string | null;
        }> = [];
        const canvas = overlayRef.current?.closest<HTMLElement>('[data-testid="app-canvas"]');
        let activeBranch: HTMLElement | null = overlayRef.current;

        while (activeBranch?.parentElement && activeBranch !== canvas) {
            const parent = activeBranch.parentElement;
            Array.from(parent.children).forEach((sibling) => {
                if (sibling === activeBranch || !(sibling instanceof HTMLElement)) return;
                inertedElements.push({
                    element: sibling,
                    inert: sibling.inert,
                    ariaHidden: sibling.getAttribute('aria-hidden'),
                });
                sibling.inert = true;
                sibling.setAttribute('aria-hidden', 'true');
            });
            activeBranch = parent;
        }

        const focusFrame = requestAnimationFrame(() => {
            const focusable = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
            focusable?.focus({ preventScroll: true });
        });

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
                return;
            }

            if (event.key !== 'Tab' || !dialogRef.current) return;

            const focusable = Array.from(
                dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
            );
            if (focusable.length === 0) {
                event.preventDefault();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            cancelAnimationFrame(focusFrame);
            document.removeEventListener('keydown', handleKeyDown);
            inertedElements.forEach(({ element, inert, ariaHidden }) => {
                element.inert = inert;
                if (ariaHidden === null) {
                    element.removeAttribute('aria-hidden');
                } else {
                    element.setAttribute('aria-hidden', ariaHidden);
                }
            });
            previouslyFocused?.focus({ preventScroll: true });
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) onClose();
    };

    return (
        <div
            ref={overlayRef}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 p-8"
            onMouseDown={handleBackdropMouseDown}
        >
            <div
                ref={dialogRef}
                aria-labelledby={titleId}
                aria-modal="true"
                className="w-full max-w-lg border border-white border-opacity-50 bg-black p-3 text-white"
                data-testid={testId}
                role="dialog"
            >
                <div className="mb-3 flex items-center justify-between border-b border-white border-opacity-50 pb-2">
                    <h2 id={titleId} className="text-xs font-normal">{title}</h2>
                    <button
                        type="button"
                        aria-label={`Close ${title}`}
                        className="cursor-pointer border border-white border-opacity-50 bg-black px-2 py-1 text-xs text-white hover:bg-white hover:text-black"
                        onClick={onClose}
                    >
                        CLOSE
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
