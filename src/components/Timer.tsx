import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
    startTime: string; // ISO string
    className?: string;
}

export const Timer: React.FC<TimerProps> = ({ startTime, className = '' }) => {
    const [elapsed, setElapsed] = useState<string>('00:00:00');

    useEffect(() => {
        const update = () => {
            const start = new Date(startTime).getTime();
            const now = new Date().getTime();
            const diff = Math.max(0, now - start);

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            const pad = (n: number) => n.toString().padStart(2, '0');
            setElapsed(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <div className={`flex items-center gap-2 font-mono text-xl font-bold ${className}`}>
            <Clock className="w-5 h-5 animate-pulse" />
            {elapsed}
        </div>
    );
};
