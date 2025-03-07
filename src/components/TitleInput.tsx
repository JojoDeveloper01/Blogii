import { component$, $, useSignal, useResource$ } from "@builder.io/qwik";
import type { BlogData } from "@lib/types";
import { sanitizeString } from "@lib/utils";
import { actions } from "astro:actions";
import { getCollection } from "astro:content";
import { ErrorMessage } from "./ErrorMessage";

export const TitleInput = component$((props: { lang: any }) => {
	const { lang } = props;
	const title = useSignal("");
	const showError = useSignal(false);
	const disableButton = useSignal(false);

	// ✅ Função para armazenar os dados do blog no sessionStorage
	const saveBlogToSession = (blogData: BlogData) => {
		sessionStorage.setItem("blogData", JSON.stringify(blogData));
	};

	// ✅ Função para construir a URL do blog
	const buildBlogURL = (title: string) => `${lang}/blog/${sanitizeString(title, 1)}`;

	// ✅ Função para verificar se o blog está disponível
	const checkBlogAvailability = async (blogURL: string, maxAttempts = 10, delay = 500) => {
		let attempts = 0;

		while (attempts < maxAttempts) {
			attempts++;
			try {
				const response = await fetch(blogURL);
				if (response.status === 200) {
					console.log("Blog disponível. Redirecionando...");
					return true;
				}
			} catch (error) {
				console.error("Erro ao verificar o blog:", error);
			}

			await new Promise((resolve) => setTimeout(resolve, delay));
		}

		console.warn(`Máximo de tentativas (${maxAttempts}) atingido.`);
		return false;
	};

	// ✅ Função para enviar os dados do blog
	const sendBlogData = async (blogData: BlogData) => {
		try {
			const { error } = await actions.sendBlogData({
				id: blogData.id,
				body: blogData.body,
				collection: blogData.collection,
				data: blogData.data,
			});

			if (error) {
				console.error("Erro ao enviar dados do blog:", error);
				return false;
			}

			return true;
		} catch (error) {
			console.error("Erro ao enviar dados do blog:", error);
			return false;
		}
	};

	// ✅ Função principal para iniciar o blog
	const startBlog = $(async () => {
		if (!title.value.trim()) {
			console.warn("Título inválido!");
			return;
		}

		const sanitizedTitle = sanitizeString(title.value);
		const blogData: BlogData = {
			id: String(Date.now()), // Gera um ID simples (ou use uma função própria)
			collection: "blog",
			data: {
				title: sanitizedTitle,
				pubDate: new Date(),
			},
		};

		saveBlogToSession(blogData);
		const blogURL = buildBlogURL(sanitizedTitle);

		// ✅ Redireciona imediatamente
		window.location.href = blogURL;

		// ✅ Envia os dados do blog e verifica disponibilidade
		const isDataSent = await sendBlogData(blogData);
		if (isDataSent) {
			const isAvailable = await checkBlogAvailability(blogURL);
			if (!isAvailable) location.reload();
		}
	});

	// ✅ Busca os blogs disponíveis (com `try/catch` para evitar erros)
	const blogData = useResource$<BlogData[]>(async () => {
		try {
			return await getCollection("blog");
		} catch (error) {
			console.error("Erro ao buscar blogs:", error);
			return [];
		}
	});

	// ✅ Manipula a entrada do usuário
	const handleInput = $(async (event: Event) => {
		const inputValue = (event.target as HTMLInputElement).value.trim();
		title.value = inputValue;

		// Espera a resolução dos blogs antes de verificar a existência do título
		const blogs = await blogData.value;
		if (blogs?.some(blog => blog.data.title === inputValue)) {
			disableButton.value = true;
			showError.value = true;
		} else {
			disableButton.value = inputValue.length < 3;
			showError.value = false;
		}
	});

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
			<ErrorMessage {...{ showError }} />
			<button
				type="button"
				id="confirm-title"
				class="w-12 h-full absolute max-phone:relative max-phone:w-full max-phone:h-4 flex justify-center items-center p-3 right-0 bg-[--text-color] text-[--bg-color] hover:text-[--orange]"
				onClick$={() => startBlog()}
				disabled={disableButton.value}
			>
				<img src="/Icons/CheckIcon.svg" alt="Check mark icon" />
			</button>
		</label>
	);
});
