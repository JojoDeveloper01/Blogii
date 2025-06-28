import editorjsHTML from "editorjs-html";

interface EditorJSBlock {
  id: string;
  type: string;
  data: {
    text?: string;
    items?: Array<{
      content: string;
      items: any[];
    }>;
    [key: string]: any;
  };
}

interface EditorJSContent {
  blocks: EditorJSBlock[];
  time: number;
  version: string;
}

export function extractTextFromEditorJS(jsonContent: string): string {
  try {
    const content = JSON.parse(jsonContent) as EditorJSContent;
    
    return content.blocks
      .map(block => {
        switch (block.type) {
          case 'paragraph':
            return block.data.text;
          case 'list':
            return block.data.items
              ?.map(item => item.content)
              .filter(Boolean)
              .join(', ');
          default:
            return '';
        }
      })
      .filter(Boolean)
      .join(' ')
  } catch {
    return 'No content';
  }
}

export function renderEditorJsToHtml(json: string): string {
  try {
    const data = JSON.parse(json);
    const parser = editorjsHTML();
    const result = parser.parse(data);

    // Se for array, junta. Se for string, retorna direto.
    return Array.isArray(result) ? result.join('') : result;
  } catch (error) {
    console.error('[renderEditorJsToHtml] Erro ao renderizar:', error);
    return '<p>Erro ao mostrar conteúdo.</p>';
  }
}