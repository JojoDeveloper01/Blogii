import { localBlogDB } from "@/services/indexedDB";
import { actions } from "astro:actions";
import type { BlogCookieItem } from "@/lib/types";
import { amountCharactersError, blogAlreadyCreated, invalidCharactersError } from "@/lib/consts";

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

export function generateLongNumericId() {
	const timestamp = Date.now();
	const randomNum = Math.floor(Math.random() * 1000);
	return `${timestamp}${randomNum}`;
}

export function generateShortNumericId() {
	return `${Math.floor(Math.random() * 10000)}`;
}

export const compressImage = async (base64: string): Promise<string> => {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';

		img.onload = () => {
			try {
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');

				if (!ctx) {
					throw new Error('Could not get canvas context');
				}

				// Reduzir tamanho da imagem
				const maxWidth = 800;
				const maxHeight = 600;
				let width = img.width;
				let height = img.height;

				if (width > maxWidth) {
					height = Math.round((maxWidth * height) / width);
					width = maxWidth;
				}
				if (height > maxHeight) {
					width = Math.round((maxHeight * width) / height);
					height = maxHeight;
				}

				canvas.width = width;
				canvas.height = height;
				ctx.drawImage(img, 0, 0, width, height);

				// Comprimir com qualidade reduzida
				const compressedData = canvas.toDataURL('image/jpeg', 0.7);
				resolve(compressedData);
			} catch (error) {
				reject(error);
			}
		};

		img.onerror = () => {
			reject(new Error('Failed to load image'));
		};

		img.src = base64;
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

export const startBlog = async (
	title: string,
	userId: string,
	isAuthorized: boolean,
	lang: string,
	showError: (show: boolean, msg: string) => void
): Promise<{ id: string; path: string } | undefined> => {
	const { isValid, sanitized } = validateTitle(title);

	if (!isValid) {
		const msg = sanitized.length < 3 ? amountCharactersError : invalidCharactersError;
		showError(true, msg);
		return;
	}

	const blogId = generateLongNumericId();
	const postId = generateShortNumericId();
	const postTitle = 'This is your first post';

	const now = new Date();

	const firstPost = {
		id: postId,
		blog_id: blogId,
		title: postTitle,
		content: '',
		created_at: now.toISOString(),
	};

	const blogData = {
		id: blogId,
		title: sanitized,
		posts: [firstPost],
		pubDate: now,
		created_at: now.toISOString(),
		user_id: isAuthorized ? userId : '',
	};

	try {
		if (isAuthorized) {
			const { error } = await actions.blog.create({ blogData });
			if (error) throw error;
		} else if (typeof window !== 'undefined') {
			await localBlogDB.saveBlog(blogData);
			cookieUtils.addBlogToCookie({
				id: blogId,
				title: sanitized,
				posts: [{ id: postId, title: postTitle }],
			});
			window.dispatchEvent(new Event('navigation-update'));
		}

		return { id: blogId, path: `/${lang}/dashboard/${blogId}/${postId}` };
	} catch (err) {
		console.error("Erro ao salvar blog:", err);
		showError(true, "Erro ao criar blog. Tente novamente");
		return;
	}
};

export const cookieUtils = {
	getCookie(name: string): string | null {
		if (typeof document === 'undefined') return null;
		const cookies = document.cookie.split('; ');
		for (const cookie of cookies) {
			const index = cookie.indexOf('=');
			if (index === -1) continue;
			const key = cookie.substring(0, index);
			const val = cookie.substring(index + 1);
			if (key === name) return decodeURIComponent(val);
		}
		return null;
	},

	setCookie(name: string, value: string, days: number) {
		if (typeof document === 'undefined') return;
		const expires = new Date();
		expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
		const encodedValue = encodeURIComponent(value);
		document.cookie = `${name}=${encodedValue};expires=${expires.toUTCString()};path=/`;
	},

	getStoredBlogs(): BlogCookieItem[] {
		if (typeof document === 'undefined') return [];
		const cookie = this.getCookie('blogiis');
		if (!cookie) return [];
		try {
			const decoded = decodeURIComponent(cookie);
			const parsed = JSON.parse(decoded);
			if (Array.isArray(parsed)) return parsed;
			return [];
		} catch (e) {
			console.warn('Failed to parse blogiis cookie', e);
			return [];
		}
	},

	addBlogToCookie(blog: BlogCookieItem) {
		if (typeof document === 'undefined') return;
		const blogs = this.getStoredBlogs();
		blogs.push(blog);
		this.setCookie('blogiis', JSON.stringify(blogs), 30);
	},

	removeBlogFromCookie(blogId: string) {
		if (typeof document === 'undefined') return;
		const blogs = this.getStoredBlogs();
		const filteredBlogs = blogs.filter(blog => blog.id !== blogId);
		this.setCookie('blogiis', JSON.stringify(filteredBlogs), 30);
	},

	removeCookie(name: string) {
		if (typeof document === 'undefined') return;
		document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
	},

	updateBlogInCookie(blogId: string, title: string) {
		if (typeof document === 'undefined') return;
		const blogs = this.getStoredBlogs();
		const blogIndex = blogs.findIndex(blog => blog.id === blogId);
		if (blogIndex !== -1) {
			blogs[blogIndex].title = title;
			this.setCookie('blogiis', JSON.stringify(blogs), 30);
		}
	}
};

export const processInput = async (
	title: string,
	isAuthorized: boolean,
	hasBlogs: boolean,
	setState: (state: { error: boolean; msg: string; login: boolean; disabled: boolean }) => void
) => {
	const trimmed = title.trim();

	if (trimmed.length < 3) {
		setState({ error: false, msg: amountCharactersError, login: false, disabled: true });
		return false;
	}

	try {
		// Só verifica hasBlogs se não estiver autorizado
		if (!isAuthorized && hasBlogs) {
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

export const deleteBlog = async (
	blogId: string,
	userId: string,
	isAuthorized: boolean,
	lang: string
): Promise<boolean> => {
	try {
		if (isAuthorized) {
			const { data, error } = await actions.blog.delete({ blogId, userId });
			if (!error && data?.success) {
				if (typeof window !== 'undefined') {
					window.location.href = `/${lang}/dashboard`;
				}
				return true;
			}
			console.warn('Erro ao apagar blog no banco de dados:', error);
		}

		await localBlogDB.deleteBlog(blogId);

		if (typeof window !== 'undefined') {
			cookieUtils.removeBlogFromCookie(blogId);
			window.location.href = `/${lang}/dashboard`;
		}

		return true;
	} catch (error) {
		console.error('Erro ao apagar blog:', error);
		return false;
	}
};

/* export const createBlog = async (entry: BlogData, path: any, fs: any) => {
	const data = entry.data;
	const filePath = path.join(process.cwd(), "src/content/blog", `${data.title}.md`);

	const frontMatter = {
		title: data.title,
		description: data.description || "",
		image: data.image || "",
		pubDate: formatDate(data.pubDate),
	};

	const frontMatterString = Object.entries(frontMatter)
		.map(([key, value]) => `${key}: "${value}"`)
		.join('\n');

	const markdownContent = `---\n${frontMatterString}\n---`;

	await fs.writeFile(filePath, markdownContent, "utf8");
	console.log(`📄 File Created successfully: ${filePath}`);
}
 */

export function redirectToBlog(Astro: any, lang: string, blogId: string) {
	return Astro.redirect(`/${lang}/dashboard/${blogId}`);
}
