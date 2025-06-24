import type { ToolSettings, BlockToolConstructable } from "@editorjs/editorjs";
import { compressImage } from "@/lib/utils";

export interface EditorConfig {
    holder: string;
    data: any;
    readOnly: boolean;
    onChange?: () => void;
    onReady?: () => void;
}

export const loadEditorTools = async (): Promise<{ EditorJS: any; tools: { [key: string]: ToolSettings } }> => {
    // Grupo 1: Core e formatação básica
    const [
        EditorJS,
        Header,
        Paragraph,
        List,
        ImageTool,
        Quote,
        Marker,
        InlineCode
    ] = await Promise.all([
        import("@editorjs/editorjs").then((m) => m.default),
        import("@editorjs/header").then((m) => m.default),
        import("@editorjs/paragraph").then((m) => m.default),
        import("@editorjs/list").then((m) => m.default),
        import("@editorjs/image").then((m) => m.default),
        import("@editorjs/quote").then((m) => m.default),
        import("@editorjs/marker").then((m) => m.default),
        import("@editorjs/inline-code").then((m) => m.default)
    ]);

    // Grupo 2: Plugins adicionais
    const [
        Warning,
        Checklist,
        Code,
        Delimiter,
        Embed,
        Link,
        Raw,
        Table
    ] = await Promise.all([
        import("@editorjs/warning").then((m) => m.default),
        import("@editorjs/checklist").then((m) => m.default),
        import("@editorjs/code").then((m) => m.default),
        import("@editorjs/delimiter").then((m) => m.default),
        import("@editorjs/embed").then((m) => m.default),
        import("@editorjs/link").then((m) => m.default),
        import("@editorjs/raw").then((m) => m.default),
        import("@editorjs/table").then((m) => m.default)
    ]);

    return {
        EditorJS,
        tools: {
            header: {
                class: Header as unknown as BlockToolConstructable,
                config: {
                    levels: [1, 2, 3],
                    defaultLevel: 1,
                },
            },
            paragraph: { class: Paragraph as unknown as BlockToolConstructable },
            list: { class: List as unknown as BlockToolConstructable, inlineToolbar: true },
            image: {
                class: ImageTool as unknown as BlockToolConstructable,
                config: {
                    uploader: {
                        async uploadByFile(file: File) {
                            try {
                                const base64 = await new Promise<string>((resolve, reject) => {
                                    const reader = new FileReader();
                                    reader.onload = () => resolve(reader.result as string);
                                    reader.onerror = reject;
                                    reader.readAsDataURL(file);
                                });

                                const compressed = await compressImage(base64);
                                return {
                                    success: 1,
                                    file: { url: compressed }
                                };
                            } catch (err) {
                                console.error("Error uploading image:", err);
                                return {
                                    success: 0,
                                    error: "Failed to upload image"
                                };
                            }
                        },
                    },
                },
            },
            quote: { class: Quote as unknown as BlockToolConstructable, inlineToolbar: true },
            warning: { class: Warning as unknown as BlockToolConstructable, inlineToolbar: true },
            marker: { class: Marker as unknown as BlockToolConstructable },
            inlineCode: { class: InlineCode as unknown as BlockToolConstructable },
            checklist: { class: Checklist as unknown as BlockToolConstructable },
            code: { class: Code as unknown as BlockToolConstructable },
            delimiter: { class: Delimiter as unknown as BlockToolConstructable },
            embed: {
                class: Embed as unknown as BlockToolConstructable,
                config: {
                    services: {
                        youtube: true,
                        codesandbox: true,
                        codepen: true,
                    }
                }
            },
            linkTool: {
                class: Link as unknown as BlockToolConstructable,
                config: {
                    endpoint: '/api/fetch-metadata'
                }
            },
            raw: { class: Raw as unknown as BlockToolConstructable },
            table: {
                class: Table as unknown as BlockToolConstructable,
                inlineToolbar: true,
                config: {
                    rows: 2,
                    cols: 3,
                },
            }
        }
    };
};

export const createEditor = async (config: EditorConfig) => {
    const { EditorJS, tools } = await loadEditorTools();
    return new EditorJS({
        ...config,
        tools,
        autofocus: false
    });
};

export const sanitizeEditorData = (data: any) => {
    if (!data?.blocks) return { blocks: [] };
    return {
        blocks: data.blocks.filter((block: any) =>
            !(block.type === 'paragraph' && (!block.data || !block.data.text))
        )
    };
};
