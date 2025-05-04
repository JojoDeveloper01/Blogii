// string para remover os traços e acentos e acrescentar false para deixar os traços e deixar os acentos
export const sanitizeString = (string: string, option = 0) => {
	if (typeof string !== "string") return "";

	let sanitized = string;

	sanitized.trim()

	if (option === 0) {
		// Opção 0: Texto estranho para normal (sem nenhum caractere especial)
		sanitized = sanitized
			.replace(/[^a-zA-ZÀ-ÿ0-9\s]/g, "") // Remove TODOS os caracteres especiais
			.replace(/\s+/g, " ") // Substitui múltiplos espaços por um único
			.toUpperCase(); // Converte para maiúsculas
	} else if (option === 1) {
		// Opção 1: URL (espaços transformados em traços)
		sanitized = sanitized
			.normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
			.replace(/[^a-zA-ZÀ-ÿ0-9\s]/g, "") // Remove TODOS os caracteres especiais
			.replace(/\s+/g, "-") // Substitui múltiplos espaços por traços
			.toLowerCase()
	} else if (option === 2) {
		// Opção 2: URL para texto
		sanitized = sanitized
			.replace(/-+/g, " ")
			.toLowerCase()
	}

	// Retorna sempre em minúsculas
	return sanitized;
};

export function formatDate(date: Date): string {
	return date.toLocaleDateString("en-US", {
		year: 'numeric',
		month: 'short',
		day: '2-digit',
	});
}

export function generateNumericId() {
	const timestamp = Date.now();
	const randomNum = Math.floor(Math.random() * 1000);
	return `${timestamp}${randomNum}`;
}

export function getTemp(Astro: { cookies: { has: (key: string) => boolean; get: (key: string) => { value: string } | undefined } }) {
	if (Astro.cookies.has("tempBlog")) {
		const cookie = Astro.cookies.get("tempBlog");
		try {
			return JSON.parse(decodeURIComponent(cookie?.value || ""));
		} catch (err) {
			console.error("Erro ao decodificar o conteúdo da cookie:", err);
			return undefined;
		}
	}
	return undefined;
}

export function editorJsToMarkdown(data: any): string {
	let markdown = '';

	for (const block of data.blocks) {
		switch (block.type) {
			case 'paragraph':
				markdown += `${block.data.text}\n\n`;
				break;
			case 'header':
				markdown += `${'#'.repeat(block.data.level)} ${block.data.text}\n\n`;
				break;
			case 'list':
				const tag = block.data.style === 'ordered' ? '1.' : '-';
				for (const item of block.data.items) {
					markdown += `${tag} ${item}\n`;
				}
				markdown += '\n';
				break;
			default:
				markdown += `<!-- Unsupported block: ${block.type} -->\n\n`;
		}
	}

	return markdown.trim();
}
