'use client'

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { selectDrumKitAtom, selectedDrumKitIdAtom } from '@/store/atoms';
import { useSamplePreloader } from '@/hooks/useSamplePreloader';
import { DRUM_KIT_IDS, DRUM_KITS, type DrumKitId } from '@/utils/samples';
import { AppModal, appModalTriggerClass } from './AppModal';

const kitButtonClass = (isCurrent: boolean, isUnavailable: boolean) => {
    const stateClass = isCurrent
        ? 'bg-white text-black'
        : 'bg-black text-white hover:bg-white hover:text-black';
    const availabilityClass = isUnavailable
        ? 'cursor-wait opacity-40 hover:bg-black hover:text-white'
        : 'cursor-pointer';

    return `flex w-full items-center justify-between gap-4 border border-white border-opacity-50 px-3 py-2 text-left text-xs ${stateClass} ${availabilityClass}`;
};

export function DrumKitsModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [pendingKitId, setPendingKitId] = useState<DrumKitId | null>(null);
    const [failedKitId, setFailedKitId] = useState<DrumKitId | null>(null);
    const [selectionError, setSelectionError] = useState<string | null>(null);
    const selectedKitId = useAtomValue(selectedDrumKitIdAtom);
    const selectDrumKit = useSetAtom(selectDrumKitAtom);
    const { preloadKit, getKitLoadingState } = useSamplePreloader();
    const inFlightKitRef = useRef<DrumKitId | null>(null);
    const requestIdRef = useRef(0);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
            requestIdRef.current += 1;
            inFlightKitRef.current = null;
        };
    }, []);

    const openModal = useCallback(() => setIsOpen(true), []);
    const closeModal = useCallback(() => setIsOpen(false), []);

    const handleKitSelect = useCallback(async (candidateKitId: DrumKitId) => {
        const candidateState = getKitLoadingState(candidateKitId);
        const isRetryingCurrentKit = candidateKitId === selectedKitId && candidateState.status === 'error';
        if ((candidateKitId === selectedKitId && !isRetryingCurrentKit) || inFlightKitRef.current !== null) return;

        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;
        inFlightKitRef.current = candidateKitId;
        setPendingKitId(candidateKitId);
        setFailedKitId(null);
        setSelectionError(null);

        try {
            await preloadKit(candidateKitId);

            if (!isMountedRef.current || requestIdRef.current !== requestId) return;

            const loadingState = getKitLoadingState(candidateKitId);
            if (loadingState.status === 'error') {
                throw new Error(loadingState.error ?? `Could not load ${DRUM_KITS[candidateKitId].name}`);
            }

            if (candidateKitId !== selectedKitId) selectDrumKit(candidateKitId);
        } catch (error) {
            if (!isMountedRef.current || requestIdRef.current !== requestId) return;

            setFailedKitId(candidateKitId);
            setSelectionError(error instanceof Error ? error.message : `Could not load ${DRUM_KITS[candidateKitId].name}`);
        } finally {
            if (isMountedRef.current && requestIdRef.current === requestId) {
                inFlightKitRef.current = null;
                setPendingKitId(null);
            }
        }
    }, [getKitLoadingState, preloadKit, selectDrumKit, selectedKitId]);

    const pendingKitName = pendingKitId ? DRUM_KITS[pendingKitId].name : null;
    const failedKitName = failedKitId ? DRUM_KITS[failedKitId].name : null;

    return (
        <>
            <button
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                className={appModalTriggerClass}
                data-testid="drum-kits-trigger"
                onClick={openModal}
            >
                KITS
            </button>

            <AppModal isOpen={isOpen} onClose={closeModal} title="KITS" testId="drum-kits-modal">
                <div data-testid="drum-kits-panel">
                    <div
                        aria-label="Available drum kits"
                        className="max-h-80 space-y-2 overflow-y-auto pr-1"
                        role="group"
                    >
                        {DRUM_KIT_IDS.map((kitId) => {
                            const kit = DRUM_KITS[kitId];
                            const loadingState = getKitLoadingState(kitId);
                            const isCurrent = kitId === selectedKitId;
                            const isPending = kitId === pendingKitId || loadingState.status === 'loading';
                            const hasError = kitId === failedKitId || loadingState.status === 'error';
                            const isUnavailable = inFlightKitRef.current !== null && kitId !== pendingKitId;
                            const loadingPercent = Math.round(loadingState.progress * 100);
                            const visibleStatus = isPending
                                    ? `LOADING ${loadingPercent}%`
                                    : hasError
                                        ? isCurrent ? 'CURRENT · ERROR — RETRY' : 'ERROR — RETRY'
                                        : '';
                            const accessibleStatus = visibleStatus || (isCurrent ? 'current' : 'available');

                            return (
                                <button
                                    key={kitId}
                                    type="button"
                                    aria-busy={isPending || undefined}
                                    aria-disabled={isUnavailable || undefined}
                                    aria-label={`${kit.name}, ${accessibleStatus.toLowerCase()}`}
                                    aria-pressed={isCurrent}
                                    className={kitButtonClass(isCurrent, isUnavailable)}
                                    data-testid={`drum-kit-${kitId}`}
                                    onClick={() => handleKitSelect(kitId)}
                                >
                                    <span className="min-w-0 truncate">{kit.name}</span>
                                    {visibleStatus && <span className="shrink-0">{visibleStatus}</span>}
                                </button>
                            );
                        })}
                    </div>

                    <div className="sr-only" aria-live="polite" aria-atomic="true">
                        {pendingKitName && <p>Loading {pendingKitName}</p>}
                        {failedKitName && <p role="alert">{selectionError ?? `Could not load ${failedKitName}`}</p>}
                    </div>
                </div>
            </AppModal>
        </>
    );
}
