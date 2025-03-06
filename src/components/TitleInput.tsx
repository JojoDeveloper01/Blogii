import { component$, $, useSignal } from "@builder.io/qwik";
import { generateNumericId, sanitizeString } from "@lib/utils";

interface TitleInputProps {
	title: any;
	handleInput: any;
	startBlog: any;
	disableButton: any;
}

export const TitleInput = component$(({ title, handleInput, disableButton }: TitleInputProps) => {

	// ✅ Função para armazenar os dados do blog no sessionStorage
	const saveBlogToSession = (blogData: { id: string; title: string }) => {
		sessionStorage.setItem("blogData", JSON.stringify(blogData));
	};

	// ✅ Função para construir a URL do blog
	const buildBlogURL = (id: string, title: string) => {
		return `/blog/temp?id=${id}&title=${sanitizeString(title, 1)}`;
	};

	// ✅ Função para verificar se o blog está disponível
	const checkBlogAvailability = async (blogURL: string, maxAttempts = 10, delay = 500) => {
		let attempts = 0;

		while (attempts < maxAttempts) {
			attempts++;
			try {
				const response = await fetch(blogURL);
				if (response.status === 200) {
					console.log("Blog disponível. Redirecionando...");
					return true; // Blog encontrado
				}
			} catch (error) {
				console.error("Erro ao verificar o blog:", error);
			}

			// Aguarda antes da próxima tentativa
			await new Promise((resolve) => setTimeout(resolve, delay));
		}

		console.warn(`Máximo de tentativas (${maxAttempts}) atingido.`);
		return false;
	};

	// ✅ Função principal para iniciar o blog
	const startBlog = $(async (title: string) => {
		if (!title.trim()) {
			console.warn("Título inválido!");
			return;
		}

		const sanitizedTitle = sanitizeString(title);
		const blogData = {
			id: generateNumericId(),
			title: sanitizedTitle,
		};

		saveBlogToSession(blogData);
		const blogURL = buildBlogURL(blogData.id, blogData.title);

		// ✅ Redireciona imediatamente
		window.location.href = blogURL;

		// ✅ Envia os dados do blog e verifica disponibilidade
		if (await sendBlogData(blogData)) {
			const isAvailable = await checkBlogAvailability(blogURL);
			if (!isAvailable) location.reload();
		}
	});

	const sendBlogData = async (blogData: { id: string; title: string }) => {
		/* const response = await fetch("/api/create-blog", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(blogData),
		}); */
	}

	return (
		<label
			for="title-start"
			class="relative flex max-phone:flex-col items-center overflow-hidden border rounded-xl"
		>
			<input
				name="title-start"
				type="text"
				id="blog-title"
				class="w-full px-4 py-2 bg-transparent rounded-xl text-[1vw] max-phone:text-[3vw]"
				placeholder="Start your idea here..."
				aria-label="Input para título do blog"
				value={title.value}
				onInput$={handleInput}
				onKeyDown$={(event) => {
					if (event.key === "Enter" && title.value.trim().length >= 3) {
						startBlog();
					}
				}}
			/>
			<button
				type="button"
				id="confirm-title"
				class="w-12 h-full absolute max-phone:relative max-phone:w-full max-phone:h-4 flex justify-center items-center p-3 right-0 bg-[--text-color] text-[--bg-color] hover:text-[--orange]"
				onClick$={startBlog}
				disabled={disableButton.value}
			>
				<img src="/Icons/CheckIcon.svg" alt="Check mark icon" />
			</button>
		</label>
	);
});