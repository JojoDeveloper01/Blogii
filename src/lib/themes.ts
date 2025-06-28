export const predefinedThemes = {
  classic: {
    name: 'Clássico',
    styles: {
      backgroundColor: 'bg-white dark:bg-gray-900',
      textColor: 'text-gray-900 dark:text-white',
      borderColor: 'border-gray-200 dark:border-gray-700',
      borderRadius: 'rounded-lg',
      shadow: 'shadow-md hover:shadow-lg'
    },
    variables: {
      '--primary-color': '#0070f3',
      '--secondary-color': '#667eea',
      '--text-color': '#1a1a1a',
      '--background-color': '#ffffff'
    }
  },
  modern: {
    name: 'Moderno',
    styles: {
      backgroundColor: 'bg-gray-50 dark:bg-gray-800',
      textColor: 'text-gray-800 dark:text-gray-200',
      borderColor: 'border-gray-300 dark:border-gray-600',
      borderRadius: 'rounded-xl',
      shadow: 'shadow-lg hover:shadow-xl'
    },
    variables: {
      '--primary-color': '#ff4785',
      '--secondary-color': '#ff6b6b',
      '--text-color': '#2d3748',
      '--background-color': '#f7fafc'
    }
  },
  minimalist: {
    name: 'Minimalista',
    styles: {
      backgroundColor: 'bg-white dark:bg-gray-900',
      textColor: 'text-gray-700 dark:text-gray-300',
      borderColor: 'border-gray-100 dark:border-gray-800',
      borderRadius: 'rounded-md',
      shadow: 'shadow-sm hover:shadow-md'
    },
    variables: {
      '--primary-color': '#48bb78',
      '--secondary-color': '#4fd1c5',
      '--text-color': '#4a5568',
      '--background-color': '#ffffff'
    }
  },
  dark: {
    name: 'Escuro',
    styles: {
      backgroundColor: 'bg-gray-900',
      textColor: 'text-gray-200',
      borderColor: 'border-gray-700',
      borderRadius: 'rounded-lg',
      shadow: 'shadow-md hover:shadow-xl'
    },
    variables: {
      '--primary-color': '#4299e1',
      '--secondary-color': '#48bb78',
      '--text-color': '#cbd5e0',
      '--background-color': '#1a1a1a'
    }
  }
};

export type ThemeName = keyof typeof predefinedThemes;

// Função para aplicar o tema (usada apenas no cliente)
export function applyTheme(themeName: ThemeName, customStyles?: string) {
  if (typeof document === 'undefined') return;
  
  const theme = predefinedThemes[themeName];
  
  // Cria o elemento de estilo para as variáveis do tema
  const themeStyle = document.createElement('style');
  themeStyle.textContent = `
    :root {
      ${Object.entries(theme.variables)
        .map(([key, value]) => `${key}: ${value};`)
        .join('\n')}
    }
  `;
  themeStyle.setAttribute('is:global', '');
  document.head.appendChild(themeStyle);
  
  // Cria o elemento de estilo para os estilos personalizados
  if (customStyles) {
    const customStyle = document.createElement('style');
    customStyle.setAttribute('set:html', customStyles);
    document.head.appendChild(customStyle);
  }
  
  return theme.styles;
}
