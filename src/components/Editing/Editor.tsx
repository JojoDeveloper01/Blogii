import { $, component$ } from '@builder.io/qwik';
import { useSignal, useVisibleTask$ } from '@builder.io/qwik';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import ImageTool from '@editorjs/image';
import type { BlogData } from '@lib/types';
import { blogDB } from '@services/indexedDB';

const compressImage = async (base64: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Reduzir tamanho da imagem
            const maxWidth = 800;
            const maxHeight = 600;
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (maxWidth * height) / width;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (maxHeight * width) / height;
                height = maxHeight;
            }

            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);

            // Comprimir com qualidade reduzida
            resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
    });
};

export const Editor = component$(({ blog }: { blog: BlogData }) => {
    const editorInstance = useSignal<EditorJS>();
    const editorReady = useSignal(false);
    const lastSaved = useSignal<Date | null>(null);
    const saveStatus = useSignal('');
    const saveTimeout = useSignal<number | null>(null);

    const updateSaveStatus = $(() => {
        if (!lastSaved.value) return;

        const now = new Date();
        const diff = Math.floor((now.getTime() - lastSaved.value.getTime()) / 1000);

        if (diff < 5) {
            saveStatus.value = 'Salvo agora';
        } else if (diff < 60) {
            saveStatus.value = `Salvo há ${diff} segundos`;
        } else if (diff < 180) {
            saveStatus.value = `Salvo há ${Math.floor(diff / 60)} minutos`;
        } else {
            saveStatus.value = '';
        }
    });

    // Atualizar status a cada 30 segundos
    useVisibleTask$(({ cleanup }) => {
        const interval = setInterval(() => updateSaveStatus(), 30000);
        cleanup(() => clearInterval(interval));
    });

    useVisibleTask$(async ({ cleanup, track }) => {
        track(() => editorReady.value);

        if (!document.getElementById('editorjs')) {
            console.error('Editor element not found');
            return;
        }

        try {
            const tempBlog = await blogDB.getTempBlog();
            if (!tempBlog) {
                console.warn('No temp blog found, using empty editor');
            }

            const initialData = tempBlog?.body
                ? typeof tempBlog.body === 'string'
                    ? JSON.parse(tempBlog.body)
                    : tempBlog.body
                : { blocks: [] };

            const editor = new EditorJS({
                holder: 'editorjs',
                placeholder: 'Escreve aqui o teu conteúdo...',
                tools: {
                    header: Header,
                    list: List,
                    image: {
                        class: ImageTool,
                        config: {
                            uploader: {
                                async uploadByFile(file: File) {
                                    return new Promise((resolve) => {
                                        const reader = new FileReader();
                                        reader.onload = async () => {
                                            const base64 = reader.result as string;
                                            const compressed = await compressImage(base64);
                                            resolve({
                                                success: 1,
                                                file: {
                                                    url: compressed,
                                                },
                                            });
                                        };
                                        reader.readAsDataURL(file);
                                    });
                                },
                            },
                        },
                    },
                },
                data: initialData,
                onChange: async () => {
                    try {
                        // Cancelar timeout anterior se existir
                        if (saveTimeout.value) {
                            clearTimeout(saveTimeout.value);
                        }

                        // Definir novo timeout (salvar após 2 segundos de inatividade)
                        saveTimeout.value = window.setTimeout(async () => {
                            const output = await editor.save();
                            await blogDB.saveTempBlog({
                                ...blog,
                                body: JSON.stringify(output)
                            });
                            lastSaved.value = new Date();
                            updateSaveStatus();
                            saveStatus.value = 'Salvo agora';
                        }, 2000);

                    } catch (err) {
                        console.error('Erro ao salvar:', err);
                        saveStatus.value = 'Erro ao salvar';
                    }
                },
                onReady: () => {
                    editorReady.value = true;
                }
            });

            editorInstance.value = editor;
        } catch (err) {
            console.error("Erro ao inicializar editor:", err);
        }

        cleanup(() => {
            if (saveTimeout.value) {
                clearTimeout(saveTimeout.value);
            }
            if (editorInstance.value) {
                editorInstance.value.destroy();
                editorInstance.value = undefined;
            }
        });
    });

    return (
        <div class="relative">
            <div id="editorjs" class="bg-white p-4 rounded shadow-md text-black min-h-[200px]" />
            <div class="absolute bottom-2 right-2 text-sm text-gray-500 italic">
                {saveStatus.value}
            </div>
            {!editorReady.value && (
                <div class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
                    <div class="animate-pulse">Carregando editor...</div>
                </div>
            )}
        </div>
    );
});
