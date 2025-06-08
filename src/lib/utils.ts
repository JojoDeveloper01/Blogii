import { blogDB } from "@services/indexedDB";
import type { BlogData } from "@lib/types";
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

export const startBlog = async (title: string, showError: (show: boolean, msg: string) => void): Promise<{ id: string; path: string } | undefined> => {
	const { isValid, sanitized } = validateTitle(title);

	if (!isValid) {
		showError(true, sanitized.length < 3 ? amountCharactersError : invalidCharactersError);
		return;
	}

	try {
		const blogId = generateNumericId();
		await blogDB.saveBlog({
			id: blogId,
			collection: "blog",
			data: { 
				title: sanitized, 
				pubDate: new Date() 
			},
		});

		// Add to cookie
		if (typeof window !== 'undefined') {
			cookieUtils.addBlogToCookie({ id: blogId, title: sanitized });
			window.dispatchEvent(new Event('navigation-update'));
		}

		return { 
			id: blogId,
			path: `blog/temp?id=${blogId}&editing=true`
		};
	} catch (error) {
		console.error("Erro ao salvar blog:", error);
		showError(true, "Erro ao criar blog. Tente novamente");
		return undefined;
	}
};

interface BlogCookieItem {
	id: string;
	title: string;
}

// Only use these functions on the client side
export const cookieUtils = {
	getCookie(name: string): string | null {
		if (typeof document === 'undefined') return null;
		const value = `; ${document.cookie}`;
		const parts = value.split(`; ${name}=`);
		if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
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
			return JSON.parse(decodeURIComponent(cookie));
		} catch {
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
		if (hasBlogs && !isAuthorized) {
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
	blogId: string,
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
		const blog = await blogDB.getBlog(blogId);
		if (blog) {
			const updatedBlog: BlogData = {
				...blog,
				data: {
					...blog.data,
					title: sanitized,
					updatedDate: new Date()
				}
			};

			// Update blog in IndexedDB
			await blogDB.saveBlog(updatedBlog);

			// Update title in cookie
			if (typeof window !== 'undefined') {
				cookieUtils.updateBlogInCookie(blogId, sanitized);
			}
		}

		callbacks.onSuccess();
	} catch (err) {
		console.error('Error updating title:', err);
		callbacks.onError();
	}
};

export const deleteBlog = async (
	blogId: string,
	callbacks: {
		onSuccess: () => void;
		onError: (error: any) => void;
	}
) => {
	try {
		// Delete from IndexedDB
		await blogDB.deleteBlog(blogId);

		// Delete from cookie on client side
		if (typeof window !== 'undefined') {
			cookieUtils.removeBlogFromCookie(blogId);
		}

		callbacks.onSuccess();
	} catch (error) {
		console.error('Error deleting blog:', error);
		callbacks.onError(error);
	}
};

export const createBlog = async (entry: BlogData, path: any, fs: any) => {
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