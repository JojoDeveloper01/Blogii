// string para remover os traços e acentos e acrescentar false para deixar os traços e deixar os acentos
export const sanitizeString = (string: string, option = 0) => {
	if (typeof string !== "string") return "";

	let sanitized = string;

	if (option === 0) {
		// Opção 1: Texto estranho para normal (sem nenhum caractere especial)
		sanitized = sanitized
			.replace(/[^a-zA-ZÀ-ÿ0-9\s]/g, "") // Remove TODOS os caracteres especiais
			.replace(/\s+/g, " ") // Substitui múltiplos espaços por um único
			.trim(); // Remove espaços extras nas extremidades
	} else if (option === 1) {
		// Opção 2: URL (espaços transformados em traços)
		sanitized = sanitized
			.replace(/[^a-zA-ZÀ-ÿ0-9\s]/g, "") // Remove TODOS os caracteres especiais
			.replace(/\s+/g, "-") // Substitui múltiplos espaços por traços
			.trim(); // Remove traços extras nas extremidades
	} else if (option === 2) {
		// Opção 3: URL para texto
		sanitized = sanitized.replace(/-+/g, " ").trim();
	}

	// Retorna sempre em minúsculas
	return sanitized.toLowerCase();
};

export function generateNumericId() {
	const timestamp = Date.now();
	const randomNum = Math.floor(Math.random() * 1000);
	return `${timestamp}${randomNum}`;
}
