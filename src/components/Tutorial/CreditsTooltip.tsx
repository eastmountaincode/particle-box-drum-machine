'use client';

import React from 'react';

interface CreditsTooltipProps {
    isVisible: boolean;
}

export const CreditsTooltip: React.FC<CreditsTooltipProps> = ({ isVisible }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-black border border-white border-opacity-50 shadow-2xl p-3 text-center">
                <div className="text-xs leading-relaxed text-white">
                    <div className="font-bold mb-1">Created by Andrew Boylan</div>
                    <div className="text-xs opacity-75">
                        <a
                            href="andreweboylan@gmail.com"
                            className=""
                        >
                            andreweboylan@gmail.com
                        </a>
                        {' • '}
                        <a
                            href="https://andrew-boylan.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className=""
                        >
                            andrew-boylan.com
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};