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
                'fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 transform z-50',
                'bg-white bg-opacity-80 backdrop-filter backdrop-blur-md',
                isVisible.value ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
                type === 'success' ? 'text-green-500' : 'text-red-500'
            ].join(' ')}
        >
            {message}
        </div>
    );
});
