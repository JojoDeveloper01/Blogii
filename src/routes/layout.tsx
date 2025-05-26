import { component$, Slot, useVisibleTask$ } from '@builder.io/qwik';

export default component$(() => {
    useVisibleTask$(({ cleanup }) => {
        const cleanupFn = () => {
            // Limpar recursos do IndexedDB quando necessário
            if (window.location.pathname === '/') {
                sessionStorage.removeItem('lastBlogState');
            }
        };

        window.addEventListener('unload', cleanupFn);
        cleanup(() => {
            window.removeEventListener('unload', cleanupFn);
        });
    });

    return <Slot />;
});
