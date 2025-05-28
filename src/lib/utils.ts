import { blogDB } from "@services/indexedDB";
import { amountCharactersError, blogAlreadyCreated, invalidCharactersError } from "@lib/consts";

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

export const TITLE_REGEX = /^[a-zA-Z0-9À-ÿ\s]+$/u;

export const validateTitle = (title: string) => {
	const trimmed = title.trim();
	return {
		isValid: trimmed.length >= 3 && TITLE_REGEX.test(trimmed),
		sanitized: trimmed.replace(/[^a-zA-Z0-9À-ÿ\s]/g, '')
	};
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

export const compressImage = async (base64: string): Promise<string> => {
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

/* export function editorJsToMarkdown(data: any): string {
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
} */

export const startBlog = async (title: string, showError: (show: boolean, msg: string) => void) => {
	const { isValid, sanitized } = validateTitle(title);

	if (!isValid) {
		showError(true, sanitized.length < 3 ? amountCharactersError : invalidCharactersError);
		return;
	}

	try {
		await blogDB.saveTempBlog({
			collection: "blog",
			data: { title: sanitized, pubDate: new Date() }
		});
		window.dispatchEvent(new Event('navigation-update'));
		window.location.href = `blog/temp?id=${sanitizeString(title, 1)}&editing=true`;
	} catch (error) {
		console.error("Erro ao salvar blog:", error);
		showError(true, "Erro ao criar blog. Tente novamente.");
	}
};

export const processInput = async (
	title: string,
	isAuthorized: boolean,
	setState: (state: { error: boolean; msg: string; login: boolean; disabled: boolean }) => void
) => {
	const trimmed = title.trim();

	if (trimmed.length < 3) {
		setState({ error: false, msg: amountCharactersError, login: false, disabled: true });
		return false;
	}

	try {
		const existingBlog = await blogDB.getTempBlog();
		if (existingBlog && !isAuthorized) {
			setState({ error: true, msg: blogAlreadyCreated, login: true, disabled: true });
			return false;
		}

		setState({ error: false, msg: '', login: false, disabled: false });
		return true;
	} catch (error) {
		console.error("Erro ao verificar blog existente:", error);
		return false;
	}
};

export const executeEditorCommand = (editor: any, command: string, params?: any) => {
	if (!editor?.isReady) {
		console.warn('Editor not ready');
		return;
	}

	switch (command) {
		case 'header':
			editor.blocks.insert('header', {
				level: params || 2,
				text: 'New Heading'
			});
			break;
		case 'paragraph':
			editor.blocks.insert('paragraph', {
				text: 'New paragraph'
			});
			break;
		case 'style':
			const selection = window.getSelection();
			if (!selection?.toString()) return;

			switch (params) {
				case 'bold':
					document.execCommand('bold', false);
					break;
				case 'italic':
					document.execCommand('italic', false);
					break;
				case 'underline':
					document.execCommand('underline', false);
					break;
			}
			break;
	}
};

export const updateBlogTitle = async (
	title: string,
	callbacks: {
		onSuccess: () => void;
		onError: () => void;
	}
) => {
	const { isValid, sanitized } = validateTitle(title);

	if (!isValid) {
		console.warn('Title validation failed');
		return;
	}

	try {
		const currentUrl = new URL(window.location.href);
		currentUrl.searchParams.set('id', sanitizeString(sanitized, 1));
		window.history.replaceState({}, '', currentUrl.toString());

		const tempBlog = await blogDB.getTempBlog();
		if (tempBlog) {
			const updatedBlog = {
				...tempBlog,
				data: {
					...tempBlog.data,
					title: sanitized,
					lastUpdated: new Date().toISOString()
				}
			};
			await blogDB.saveTempBlog(updatedBlog);
			try {
				await blogDB.updateBlog(updatedBlog);
			} catch (err) {
				console.warn('Failed to update main blog, but temp blog was saved:', err);
			}
		}

		callbacks.onSuccess();
	} catch (err) {
		console.error('Error updating title:', err);
		callbacks.onError();
	}
};

export const deleteBlog = async (
	callbacks: {
		onSuccess: () => void;
		onError: (error: string) => void;
	}
) => {
	try {
		await blogDB.deleteTempBlog();
		callbacks.onSuccess();
	} catch (error) {
		console.error("Error deleting blog:", error);
		callbacks.onError("Failed to delete blog. Please try again.");
	}
};

