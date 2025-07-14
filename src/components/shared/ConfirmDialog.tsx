import { component$, $, Slot } from "@builder.io/qwik";
import { icons } from "../Editing/icons";

interface ConfirmDialogProps {
    id?: string;
    title: string;
    message?: string;
    avaliableIcon?: boolean;
    css?: string;
}

export const ConfirmDialog = component$<ConfirmDialogProps>(({
    id,
    title,
    message,
    avaliableIcon,
    css,
}) => {
    return (
        <dialog
            id={id}
            class="backdrop:bg-gradient-to-br backdrop:from-[#250707] backdrop:to-[#450a0a2e] backdrop:backdrop-blur-sm rounded-xl p-0 max-w-md w-full mx-auto shadow-2xl border border-[--blanc-core] overflow-hidden"
        >
            <div class="bg-gradient-to-r from-[#250707] to-[#450a0a2e] p-5 border-b border-red-900/30">
                <div class="flex items-center gap-3">
                    <div class="p-2 rounded-full bg-red-500/20 text-red-400">
                        {avaliableIcon && (
                            <span dangerouslySetInnerHTML={icons.alert} />
                        )}
                    </div>
                    <h2 class="text-xl font-bold text-red-300">{title}</h2>
                </div>
            </div>

            {/* Content */}
            <div class="p-6 bg-[--noir-core]">
                {message && <p class="text-[--blanc-core] mb-8 text-base">{message}</p>}

                {/* Actions */}
                <div class={`flex gap-4 justify-end ${css}`}>
                    <Slot />
                    <button
                        type="submit"
                        onClick$={(e) => (e.target as HTMLElement).closest('dialog')?.close()}
                        class="px-5 py-2.5 border border-[--blanc-core] rounded-lg text-[--blanc-core] hover:bg-[--blanc-core] hover:border-[--blanc-core] hover:text-[--noir-core] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </dialog>
    );
});
