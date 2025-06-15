import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';

interface ToastProps {
    message: string;
    type?: 'success' | 'error';
    duration?: number;
    onClose$?: () => void;
}

export const Toast = component$<ToastProps>(({
    message,
    type = 'success',
    duration = 3000,
    onClose$
}) => {
    const isVisible = useSignal(true);

    useVisibleTask$(({ cleanup }) => {
        const timer = setTimeout(() => {
            isVisible.value = false;
            onClose$?.();
        }, duration);

        cleanup(() => clearTimeout(timer));
    });

    return (
        <div
            class={[
                'fixed bottom-2 right-2 px-3 py-1.5 text-sm rounded-md transition-all duration-300 transform z-50',
                'border border-gray-100/30 dark:border-gray-800/30',
                'bg-white/40 dark:bg-zinc-800/40 backdrop-blur-sm',
                'shadow-sm',
                isVisible.value ? 'translate-y-0 opacity-70' : 'translate-y-2 opacity-0',
                type === 'success' 
                    ? 'text-green-600/90 dark:text-green-400/90' 
                    : 'text-red-600/90 dark:text-red-400/90'
            ].join(' ')}
        >
            <div class="flex items-center gap-1.5">
                {type === 'success' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                )}
                {message}
            </div>
        </div>
    );
});
