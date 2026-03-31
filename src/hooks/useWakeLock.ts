import { useRef, useCallback } from 'react';

export const useWakeLock = () => {
    const wakeLock = useRef<any>(null);

    const requestWakeLock = useCallback(async () => {
        if ('wakeLock' in navigator) {
            try {
                wakeLock.current = await (navigator as any).wakeLock.request('screen');
                console.log('Wake Lock is active');
            } catch (err: any) {
                console.error(`${err.name}, ${err.message}`);
            }
        } else {
            console.warn('Wake Lock API not supported');
        }
    }, []);

    const releaseWakeLock = useCallback(async () => {
        if (wakeLock.current) {
            try {
                await wakeLock.current.release();
                wakeLock.current = null;
                console.log('Wake Lock was released');
            } catch (err: any) {
                console.error(`${err.name}, ${err.message}`);
            }
        }
    }, []);

    return { requestWakeLock, releaseWakeLock };
};
