import { component$ } from "@builder.io/qwik";

interface ConfirmDialogProps {
    onConfirm$: () => void;
    id?: string;
    title: string;
    message: string;
}

export const ConfirmDialog = component$<ConfirmDialogProps>(({
    onConfirm$,
    id,
    title,
    message
}) => {
    return (
        <dialog
            id={id}
            class="backdrop:bg-black/50 rounded-lg p-6 max-w-sm w-full mx-auto shadow-xl bg-white dark:bg-gray-800"
        >
            <h3 class="text-lg font-semibold mb-2e">{title}</h3>
            <p class="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
            <div class="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick$={(e) => (e.target as HTMLElement).closest('dialog')?.close()}
                    class="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick$={onConfirm$}
                    class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                    Delete
                </button>
            </div>
        </dialog>
    );
});
