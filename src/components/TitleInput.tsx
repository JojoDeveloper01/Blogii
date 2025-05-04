import { component$, $, useSignal } from "@builder.io/qwik";
import type { BlogData } from "@lib/types";
import { sanitizeString } from "@lib/utils";
import { actions } from "astro:actions";
import { ErrorMessage } from "./ErrorMessage";
import { AskAuthentication } from "./AskAuthentication";
import { amountCharactersError, blogAlreadyCreated, invalidCharactersError } from "@lib/consts";

interface TitleInputProps {
	blogsData: BlogData[]
	isAuthorized: boolean
}

export const TitleInput = component$(({ blogsData, isAuthorized }: TitleInputProps) => {
	const title = useSignal("");
	const showError = useSignal(false);
	const message = useSignal("");
	const disableButton = useSignal(true);
	const messageToLoginOrCreateAccount = useSignal(false)

	const blogs = { blogsData }.blogsData

	// Função para construir a URL do blog
	const buildTempBlogURL = $((title: string) => `blog/temp?id=${title}&editing=true`);

	// Função para enviar os dados do blog
	const sendBlogData = $(async (blogData: BlogData) => {
		try {
			const { data, error } = await actions.sendBlogData(blogData);

			if (error) {
				console.error("Erro ao enviar dados do blog:", error.message);
				return false;
			}

			return data.success;
		} catch (error) {
			console.error("Erro ao enviar dados do blog:", error);
			return false;
		}
	});

	// Função principal para iniciar o blog 
	const startBlog = $(async () => {
		const sanitizedTitle = sanitizeString(title.value);

		if (sanitizedTitle.length < 3 || !/^[\p{L}\s]+$/u.test(sanitizedTitle)) {
			showError.value = true;
			message.value = sanitizedTitle.length < 3 ? amountCharactersError : invalidCharactersError;
			return;
		}

		const blogData: BlogData = {
			collection: "blog",
			data: { title: sanitizedTitle, pubDate: new Date() },
		};

		const blogURL = await buildTempBlogURL(sanitizeString(title.value, 1));

		if (!isAuthorized) {
			document.cookie = `tempBlog=${encodeURIComponent(JSON.stringify(blogData))}; path=/;`;
			window.location.href = blogURL;
			return;
		}

		if (await sendBlogData(blogData)) {
			await new Promise((resolve) => setTimeout(resolve, 100));
			window.location.href = blogURL;
		}
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
			message.value = amountCharactersError;
			messageToLoginOrCreateAccount.value = false;
			return false;
		}

		// Verifica se o blog já existe e se o usuário está autorizado
		if (blogs.length > 0 && isAuthorized === false) {
			showError.value = true;
			message.value = blogAlreadyCreated;
			messageToLoginOrCreateAccount.value = true;
			disableButton.value = true;
			return false;
		} else {
			messageToLoginOrCreateAccount.value = false;
			showError.value = false;
			disableButton.value = false;
			return true;
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
			<div>
				<ErrorMessage {...{ showError, message: message.value }} />
				{messageToLoginOrCreateAccount.value && (<AskAuthentication />)}
			</div>
		</div>
	);
});
