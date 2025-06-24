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
      .slice(0, 150) + '...';
  } catch {
    return 'No content';
  }
}
