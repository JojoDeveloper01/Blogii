import { component$, $, useSignal, useResource$, Resource } from "@builder.io/qwik";
import type { BlogData } from "@lib/types";
import { sanitizeString } from "@lib/utils";
import { actions } from "astro:actions";
import { ErrorMessage } from "./ErrorMessage";
import { AskAuthentication } from "./AskAuthentication";

interface TitleInputProps {
	blogsData: BlogData[]
	isAuthorized: boolean
}

export const TitleInput = component$(({ blogsData, authorization }: TitleInputProps) => {
	const title = useSignal("");
	const showError = useSignal(false);
	const message = useSignal("");
	const disableButton = useSignal(true);

	const blogs = { blogsData }.blogsData

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
		const urlTitle = sanitizeString(title.value, 1);
		const sanitizedTitle = sanitizeString(title.value);

		// Verifica se o título tem pelo menos 3 caracteres
		if (sanitizedTitle.length < 3) {
			showError.value = true;
			message.value = "The title must be at least 3 characters long.";
			return;
		}

		// Verifica se o título contém caracteres estranhos
		if (!/^[\p{L}\s]+$/u.test(sanitizedTitle)) {
			showError.value = true;
			message.value = "The title contains invalid characters.";
			return;
		}

		console.log(sanitizedTitle)

		const blogData: BlogData = {
			collection: "blog",
			data: {
				title: sanitizedTitle,
				pubDate: new Date(),
			},
		};

		console.log(blogData.data)

		alert(urlTitle + ": -- :" + sanitizedTitle)
		// Store the blog data in a cookie
		document.cookie = `temp=${encodeURIComponent(JSON.stringify(blogData))}; path=/;`;

		const blogURL = await buildBlogURL(urlTitle);
		/* const isDataSent = await sendBlogData(blogData); */

		/* const s = await getBlogData(); */

		/* if (isDataSent) { */
		// Pequena pausa para garantir que o arquivo foi criado
		//await new Promise((resolve) => setTimeout(resolve, 100));
		window.location.href = `${blogURL}`;
		// }
	});

	const handleBeforeInput = $((event: InputEvent) => {
		const input = event.data;
		if (input && !/^[\p{L}\s]+$/u.test(input)) {
			event.preventDefault();
		}
	});

	// Função combinada para processar input e tecla Enter
	const processInput = $(async (inputValue: string) => {
		title.value = inputValue.trim();

		// Verifica o comprimento do título
		if (title.value.length < 3) {
			disableButton.value = true;
			showError.value = false;
			return false; // Retorna falso se o título for muito curto
		}

		// Verifica se o blog já existe e se o usuário está autorizado
		if (blogs.length > 0 && isAuthorized === false) {
			showError.value = true;
			disableButton.value = true;
			return false; // Retorna falso se houver erro
		} else {
			showError.value = false;
			disableButton.value = false;
			return true; // Retorna verdadeiro se tudo estiver OK
		}
	});

	// Função para lidar com o evento de input
	const handleInput = $(async (event: Event) => {
		const inputValue = (event.target as HTMLInputElement).value;
		await processInput(inputValue);
	});

	// Função para lidar com o evento de tecla pressionada
	const handleKeyDown = $(async (event: KeyboardEvent) => {
		if (event.key === "Enter") {
			const isValid = await processInput(title.value);
			if (isValid) {
				startBlog();
			}
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
					onKeyDown$={handleKeyDown}
					onBeforeInput$={handleBeforeInput} // Bloqueia caracteres proibidos
				/>
				<ErrorMessage {...{ showError, message: message.value }} />
				<button
					type="button"
					id="confirm-title"
					class="w-12 h-full absolute max-phone:relative max-phone:w-full max-phone:h-4 flex justify-center items-center p-3 right-0 text-[--bg-color] hover:text-[--orange]"
					onClick$={() => startBlog()}
					disabled={disableButton.value}
				>
					<img src="/Icons/CheckIcon.svg" alt="Check mark icon" />
				</button>
			</label>
			{authorization && (<AskAuthentication />)}
		</div>
	);
});
