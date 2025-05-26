import { $, component$ } from "@builder.io/qwik";
import { useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type EditorJS from "@editorjs/editorjs";
import type { BlogData } from "@lib/types";
import { blogDB } from "@services/indexedDB";
import { EditorToolbar } from "./EditorToolbar";
import { compressImage } from "@lib/utils";

export const Editor = component$(
    ({ blog, lang }: { blog: BlogData; lang: string }) => {
        const editorInstance = useSignal<EditorJS>();
        const editorReady = useSignal(false);
        const lastSaved = useSignal<Date | null>(null);
        const saveStatus = useSignal("");
        const saveTimeout = useSignal<number | null>(null);
        const title = useSignal(blog.data.title || "");
        const toolsLoaded = useSignal(false);
        const langSignal = useSignal(lang).value

        const updateSaveStatus = $(() => {
            if (!lastSaved.value) return;

            const now = new Date();
            const diff = Math.floor(
                (now.getTime() - lastSaved.value.getTime()) / 1000,
            );

            if (diff < 5) {
                saveStatus.value = "Salvo agora";
            } else if (diff < 60) {
                saveStatus.value = `Salvo há ${diff} segundos`;
            } else if (diff < 180) {
                saveStatus.value = `Salvo há ${Math.floor(diff / 60)} minutos`;
            } else {
                saveStatus.value = "";
            }
        });

        // Atualizar status a cada 30 segundos
        useVisibleTask$(({ cleanup }) => {
            const interval = setInterval(() => updateSaveStatus(), 30000);
            cleanup(() => clearInterval(interval));
        });

        const sanitizeInitialData = $((data: any) => {
            if (!data?.blocks) return { blocks: [] };
            return {
                blocks: data.blocks.filter((block: any) =>
                    !(block.type === 'paragraph' && (!block.data || !block.data.text))
                )
            };
        });

        useVisibleTask$(async ({ cleanup, track }) => {
            track(() => editorReady.value);

            try {
                const [
                    EditorJS,
                    Header,
                    List,
                    Paragraph,
                    ImageTool,
                    Quote,
                    Warning,
                    Marker,
                    InlineCode,
                    Checklist,
                    Code,
                    Delimiter,
                    Embed,
                    Link,
                    Raw,
                    Table
                ] = await Promise.all([
                    import("@editorjs/editorjs").then((m) => m.default),
                    import("@editorjs/header").then((m) => m.default),
                    import("@editorjs/list").then((m) => m.default),
                    import("@editorjs/paragraph").then((m) => m.default),
                    import("@editorjs/image").then((m) => m.default),
                    import("@editorjs/quote").then((m) => m.default),
                    import("@editorjs/warning").then((m) => m.default),
                    import("@editorjs/marker").then((m) => m.default),
                    import("@editorjs/inline-code").then((m) => m.default),
                    import("@editorjs/checklist").then((m) => m.default),
                    import("@editorjs/code").then((m) => m.default),
                    import("@editorjs/delimiter").then((m) => m.default),
                    import("@editorjs/embed").then((m) => m.default),
                    import("@editorjs/link").then((m) => m.default),
                    import("@editorjs/raw").then((m) => m.default),
                    import("@editorjs/table").then((m) => m.default),
                ]);

                const tempBlog = await blogDB.getTempBlog();
                const parsedData = tempBlog?.body
                    ? typeof tempBlog.body === "string"
                        ? JSON.parse(tempBlog.body)
                        : tempBlog.body
                    : { blocks: [] };

                const initialData = await sanitizeInitialData(parsedData);

                if (tempBlog?.data.title) {
                    title.value = tempBlog.data.title;
                }

                const editor = new EditorJS({
                    holder: "editorjs",
                    data: initialData,
                    tools: {
                        paragraph: {
                            class: Paragraph as any,
                            inlineToolbar: true,
                            config: {
                                preserveBlank: true
                            }
                        },
                        header: {
                            class: Header as any,
                            config: {
                                levels: [1, 2, 3],
                                defaultLevel: 1,
                            },
                            inlineToolbar: true,
                        },
                        list: { class: List as any, inlineToolbar: true },
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
                        quote: {
                            class: Quote,
                            inlineToolbar: true,
                        },
                        warning: {
                            class: Warning,
                            inlineToolbar: true,
                        },
                        marker: { class: Marker },
                        inlineCode: { class: InlineCode },
                        checklist: {
                            class: Checklist,
                            inlineToolbar: true
                        },
                        code: {
                            class: Code,
                            config: {
                                placeholder: 'Enter code here...'
                            }
                        },
                        delimiter: { class: Delimiter },
                        embed: {
                            class: Embed,
                            config: {
                                services: {
                                    youtube: true,
                                    codesandbox: true,
                                    codepen: true,
                                }
                            }
                        },
                        linkTool: {
                            class: Link,
                            config: {
                                endpoint: '/api/fetch-metadata'
                            }
                        },
                        raw: { class: Raw },
                        table: {
                            class: Table as any,
                            inlineToolbar: true,
                            config: {
                                rows: 2,
                                cols: 3,
                            },
                        }
                    },
                    autofocus: false,
                    onChange: async () => {
                        try {
                            if (saveTimeout.value) clearTimeout(saveTimeout.value);
                            saveTimeout.value = window.setTimeout(async () => {
                                const output = await editor.save();
                                await blogDB.saveTempBlog({
                                    ...blog,
                                    data: { ...blog.data, title: title.value },
                                    body: JSON.stringify(output),
                                });
                                lastSaved.value = new Date();
                                updateSaveStatus();
                            }, 2000);
                        } catch (err) {
                            console.error("Erro ao salvar:", err);
                        }
                    },
                    onReady: () => {
                        editorReady.value = true;
                        toolsLoaded.value = true;
                    },
                });

                editorInstance.value = editor;
            } catch (err) {
                console.error("Erro ao inicializar editor:", err);
                toolsLoaded.value = true;
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
            <div class="relative editor-wrapper min-h-screen">
                <EditorToolbar title={title} lang={langSignal} editor={editorInstance} />
                <div class="editor-container max-w-[850px] mx-auto min-h-[1056px] shadow-lg my-4">
                    <div
                        id="editorjs"
                        class="p-4 min-h-[500px] bg-white border border-[#cbcbcb] rounded-lg shadow-md"
                    />
                    {!toolsLoaded.value && (
                        <div class="absolute inset-0 flex items-center justify-center bg-white/80">
                            <div class="text-center">
                                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                <p class="mt-2">Carregando editor...</p>
                            </div>
                        </div>
                    )}
                    <div class="fixed bottom-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full shadow text-sm text-gray-600 italic">
                        {saveStatus.value}
                    </div>
                </div>
            </div>
        );
    },
);
