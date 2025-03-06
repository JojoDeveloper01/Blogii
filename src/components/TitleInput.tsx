import { component$, useSignal, useResource$, useVisibleTask$, $ } from "@builder.io/qwik";
import { generateNumericId, sanitizeString } from "@lib/utils";
import type { BlogData } from "@lib/types";
import { getCollection } from "astro:content";
import { actions } from "astro:actions";


export const TitleInput = component$(({ lang }: { lang: string }) => {
	// Criamos sinais (signals) para armazenar referências aos elementos do DOM
	const blogsCreated = useSignal<HTMLElement | null>(null);
	const navbar = useSignal<HTMLElement | null>(null);
	const toggleDarkMode = useSignal<any | null>(null);
	const title = useSignal<HTMLInputElement | null>(null);
	const errorTitle = useSignal<HTMLElement | null>(null);
	const button = useSignal<HTMLButtonElement | null>(null);
	const panelAfter = useSignal<HTMLElement | null>(null);
	const blogLink = useSignal<HTMLAnchorElement | null>(null);

	const showError = useSignal(false); // Controla se a mensagem de erro deve aparecer
	const disableButton = useSignal(false); // Controla o botão de confirmar

	// `useVisibleTask$()` executa código **apenas no navegador** após a renderização
	useVisibleTask$(() => {
		blogsCreated.value = document.getElementById("blogsCreated") as HTMLElement;
		navbar.value = document.getElementById("navbar") as HTMLElement;
		toggleDarkMode.value = document.getElementById("toggle-darkmode") as any;
		title.value = document.getElementById("blog-title") as HTMLInputElement;
		errorTitle.value = document.getElementById("errorInput") as HTMLElement;
		button.value = document.getElementById("confirm-title") as HTMLButtonElement;
		panelAfter.value = document.querySelector(".panel-after") as HTMLElement;
		blogLink.value = document.getElementById("id_blogs") as HTMLAnchorElement;
	});

	//verify if has blogs in "content" collection
	const blogData = useResource$<BlogData[]>(async () => await getCollection("blog"));

	console.log(blogData)

	/* 	const hasBlogs = useResource$<any[]>(async () => {
			return await getBlogs();
		}); */

	/* 	async function getBlogs() {
			try {
				const { data, error } = await actions.hasBlog()
	
				if (error || !data.valid) {
					console.error("Erro ao obter blogs:", error);
					return [];
				}
	
				return data || {}; // Retorna um objeto vazio se não houver dados
			} catch (err: any) {
				console.error("Unexpected error:", err);
				return {}; // Retorna um objeto vazio em caso de erro
			}
		} */

	const startBlog = $(() => {
		console.log("Blog iniciado com título:", title.value?.value);
		title.value!.value = ""; // Limpa o input após iniciar
	});

	// Inicializa os botões do modal (simulação)
	const initializeModalButton = (id: string, modalId: string) => {
		const btn = document.getElementById(id);
		if (btn) {
			btn.addEventListener("click", () => {
				console.log(`Abrir modal: ${modalId}`);
			});
		}
	};

	// Manipulador de entrada do input
	const handleInput = $((event: Event) => {
		const inputValue = (event.target as HTMLInputElement).value.trim();
		if (title.value) {
			title.value.value = inputValue;
		}

		if (blogData.data.title) {
			disableButton.value = true;
			showError.value = true;
		} else {
			disableButton.value = inputValue.length < 3;
			showError.value = false;
		}
	});

	return (
		<>
			<div class="w-3/4 grid gap-2 text-left">
				<label
					for="title-start"
					id="conj-title"
					class="relative flex max-phone:flex-col items-center overflow-hidden border rounded-xl"
				>
					<input
						name="title-start"
						type="text"
						id="blog-title"
						class="w-full px-4 py-2 bg-transparent rounded-xl text-[1vw] max-phone:text-[3vw]"
						placeholder="Start your idea here..."
						aria-label="Input para título do blog"
						value={title.value?.value}
						onInput$={handleInput} // 🚀 Agora usando onInput$ corretamente!
						onKeyDown$={(event) => {
							if (event.key === "Enter" && title.value && title.value.value.trim().length >= 3) {
								startBlog();
							}
						}}
					/>
					<button
						type="button"
						id="confirm-title"
						class="w-12 h-full absolute max-phone:relative max-phone:w-full max-phone:h-4 *:max-phone:w-5 flex justify-center items-center p-3 right-0 bg-[--text-color] text-[--bg-color] hover:text-[--orange] hover:transition-[color] hover:duration-[0.6s] hover:ease-[cubic-bezier(0,0,0.04,0.65)]"
						onClick$={startBlog}
						disabled={disableButton.value}
					>
						<img src="/Icons/CheckIcon.svg" alt="Check mark icon" />
					</button>
				</label>
				{/* <span id="errorInput" class="text-red-400" aria-label="erro no input" /> */}
				{/* Mensagem de erro já está no DOM, mas fica oculta até necessário */}
				<div
					id="errorMessage"
					class={`text-red-400 ${showError.value ? "block" : "hidden"}`}
					aria-label="Erro no input"
				>
					Já tem um blog ativo.
					<button
						id="modalLogin"
						class="link"
						data-modal-target="login"
						data-modal-toggle="login"
					>
						Inicie sessão
					</button>
					ou
					<button
						id="modalRegister"
						class="link"
						data-modal-target="register"
						data-modal-toggle="register"
					>
						Crie uma conta
					</button>
				</div>
			</div>
		</>
	);
});
