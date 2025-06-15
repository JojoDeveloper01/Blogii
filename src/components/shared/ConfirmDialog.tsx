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
            class="backdrop:bg-gradient-to-br backdrop:from-[#250707] backdrop:to-[#450a0a2e] backdrop:backdrop-blur-sm rounded-xl p-0 max-w-md w-full mx-auto shadow-2xl border border-[--blanc-core] overflow-hidden"
        >
            <div class="bg-gradient-to-r from-[#250707] to-[#450a0a2e] p-5 border-b border-red-900/30">
                <div class="flex items-center gap-3">
                    <div class="p-2 rounded-full bg-red-500/20 text-red-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-red-300">{title}</h3>
                </div>
            </div>

            {/* Content */}
            <div class="p-6 bg-[--noir-core]">
                <p class="text-[--blanc-core] mb-8 text-base">{message}</p>

                {/* Actions */}
                <div class="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick$={(e) => (e.target as HTMLElement).closest('dialog')?.close()}
                        class="px-5 py-2.5 border border-[--blanc-core] rounded-lg text-[--blanc-core] hover:bg-[--blanc-core] hover:border-[--blanc-core] hover:text-[--noir-core] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick$={onConfirm$}
                        class="px-5 py-2.5 bg-gradient-to-r from-red-700 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-red-700/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                        Delete
                    </button>
                </div>
            </div>
        </dialog>
    );
});
