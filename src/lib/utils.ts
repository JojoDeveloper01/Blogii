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

export function getTemp(Astro: { cookies: { has: (arg0: string) => any; get: (arg0: string) => any; }; }) {
	if (Astro.cookies.has("temp")) {
		const getCookie = Astro.cookies.get("temp");
		// Decodificar o cookie corretamente
		return JSON.parse(decodeURIComponent(getCookie?.value || "[]"));
	}
	return null;
}