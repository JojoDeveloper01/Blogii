import { $, component$ } from '@builder.io/qwik';
import { useSignal, useVisibleTask$ } from '@builder.io/qwik';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import ImageTool from '@editorjs/image';
import type { BlogData } from '@lib/types';

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

    console.log('Blog data:', JSON.stringify(blog, null, 2));

    useVisibleTask$(() => {
        const initialData = blog.body
            ? typeof blog.body === 'string'
                ? {
                    blocks: [
                        {
                            type: 'paragraph',
                            data: {
                                text: blog.body,
                            },
                        },
                    ],
                }
                : blog.body // Se já for um objeto com a estrutura correta, use-o diretamente
            : undefined;

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
        });

        editorInstance.value = editor;

        return () => {
            editor.destroy();
        };
    });

    return (
        <>
            <div id="editorjs" class="bg-white p-4 rounded shadow-md text-black" />
            <button
                onClick$={$(() => {
                    editorInstance.value?.save().then((output) => {
                        try {
                            console.log('Conteúdo JSON:', output);

                            const existingCookie = document.cookie
                                .split('; ')
                                .find((row) => row.startsWith('tempBlog='));

                            let tempData: any = {};

                            if (existingCookie) {
                                try {
                                    const cookieValue = decodeURIComponent(existingCookie.split('=')[1]);
                                    tempData = JSON.parse(cookieValue);
                                } catch (e) {
                                    console.warn('Erro ao ler cookie existente:', e);
                                }
                            }

                            tempData.body = output;

                            const farFuture = new Date();
                            farFuture.setFullYear(farFuture.getFullYear() + 10);
                            document.cookie = `tempBlog=${encodeURIComponent(JSON.stringify(tempData))}; path=/; expires=${farFuture.toUTCString()}`;
                            alert('Conteúdo JSON salvo no cookie!');
                        } catch (error) {
                            console.error('Erro ao salvar conteúdo:', error);
                            alert('Ocorreu um erro ao salvar o conteúdo.');
                        }
                    });
                })}
            >
                Salvar Conteúdo
            </button>
        </>
    );
});
