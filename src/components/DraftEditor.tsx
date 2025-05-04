import { component$, $, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { useDraftStore } from "../stores/draftStore";
import type { DraftPost } from "../stores/draftStore";

export const DraftEditor = component$(() => {
    const title = useSignal("");
    const content = useSignal("");
    const { addDraft, updateDraft, currentDraft, setCurrentDraft } = useDraftStore();

    // Atualiza os campos quando currentDraft muda
    useVisibleTask$(({ track }) => {
        track(() => currentDraft);
        if (currentDraft) {
            title.value = currentDraft.title;
            content.value = currentDraft.content;
        } else {
            title.value = "";
            content.value = "";
        }
    });

    const handleCreateDraft = $(async () => {
        if (title.value.trim() && content.value.trim()) {
            await addDraft({
                title: title.value,
                content: content.value,
            });
            title.value = "";
            content.value = "";
        }
    });

    const handleUpdateDraft = $(async () => {
        if (!currentDraft?.id || !title.value.trim() || !content.value.trim()) {
            return;
        }

        await updateDraft(currentDraft.id, {
            title: title.value,
            content: content.value,
        });
        setCurrentDraft(null);
    });

    return (
        <div class="max-w-2xl mx-auto p-4">
            <div class="space-y-4">
                <input
                    type="text"
                    class="w-full p-2 border rounded"
                    placeholder="Título do rascunho"
                    value={title.value}
                    onInput$={(e) => (title.value = (e.target as HTMLInputElement).value)}
                />
                <textarea
                    class="w-full p-2 border rounded h-40"
                    placeholder="Conteúdo do rascunho"
                    value={content.value}
                    onInput$={(e) => (content.value = (e.target as HTMLTextAreaElement).value)}
                />
                <div class="flex gap-2">
                    {currentDraft ? (
                        <>
                            <button
                                class="px-4 py-2 bg-blue-500 text-white rounded"
                                onClick$={handleUpdateDraft}
                            >
                                Atualizar Rascunho
                            </button>
                            <button
                                class="px-4 py-2 bg-gray-500 text-white rounded"
                                onClick$={() => setCurrentDraft(null)}
                            >
                                Cancelar
                            </button>
                        </>
                    ) : (
                        <button
                            class="px-4 py-2 bg-green-500 text-white rounded"
                            onClick$={handleCreateDraft}
                        >
                            Criar Rascunho
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}); 