import { component$, $, useSignal, useResource$, Resource } from "@builder.io/qwik";
import type { BlogData } from "@lib/types";
import { sanitizeString } from "@lib/utils";
import { actions } from "astro:actions";
import { ErrorMessage } from "./ErrorMessage";

export const TitleInput = component$((blogsData: BlogData[]) => {
	console.log("blogs: ", blogsData)

	const title = useSignal("");
	const showError = useSignal(false);
	const disableButton = useSignal(false);

	// Função para construir a URL do blog
	const buildBlogURL = $((title: string) => `blog/temp?id=${title}`);

	// Função para enviar os dados do blog
	const sendBlogData = $(async (blogData: BlogData) => {
		try {
			const { error } = await actions.sendBlogData(blogData);

			if (error) {
				console.error("Erro ao enviar dados do blog:", error);
				return false;
			}

			return true;
		} catch (error) {
			console.error("Erro ao enviar dados do blog:", error);
			return false;
		}
	});

	// Função principal para iniciar o blog 
	const startBlog = $(async () => {
		if (!title.value.trim()) {
			console.warn("Título inválido!");
			return;
		}

		const sanitizedTitle = sanitizeString(title.value);
		const blogData: BlogData = {
			collection: "blog",
			data: {
				title: sanitizedTitle,
				pubDate: new Date(),
			},
		};

		// Store the blog data in a cookie
		document.cookie = `temp=${JSON.stringify(blogData)}; path=/;`;

		const blogURL = await buildBlogURL(sanitizedTitle);
		/* const isDataSent = await sendBlogData(blogData); */

		/* const s = await getBlogData(); */

		/* if (isDataSent) { */
		// Pequena pausa para garantir que o arquivo foi criado
		//await new Promise((resolve) => setTimeout(resolve, 100));
		window.location.href = `${blogURL}`;
		//}
	});

	// Busca os blogs disponíveis (com `try/catch` para evitar erros)
	const getBlogData = $(async () => {
		try {
			const { error, data } = await actions.cleanCache({ a: "a" });
			/* console.log("📂 Blogs disponíveis:", data?.blogs);
			alert("Blog criado com sucesso! 4"); */
			if (error) throw new Error("Erro ao buscar blogs");

			return data.blogs;
		} catch (error) {
			console.error("❌ Erro ao buscar blogs:", error);
			return [];
		}
	});

	// Manipula a entrada do usuário
	const handleInput = $(async (event: Event) => {
		const inputValue = (event.target as HTMLInputElement).value.trim();
		title.value = inputValue;

		// Espera a resolução dos blogs antes de verificar a existência do título

		if (blogs?.some((b: BlogData) => b.data.title === inputValue)) {
			disableButton.value = true;
			showError.value = true;
		} else {
			disableButton.value = inputValue.length < 3;
			showError.value = false;
		}
	});

	return (
		<div class="w-3/4 grid gap-2 text-left">
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
		</div>
	);
});
