// Função para aplicar classes personalizadas
export function getCustomClasses(customClasses: string | undefined, themeStyles: any) {
    if (!customClasses) return "";
    return `${themeStyles} ${customClasses}`;
}