import { component$, $, type QRL } from "@builder.io/qwik";

export const TitleInput = component$(() => {
	const $startBlog = $(() => {
		// Add blog start logic here
	});

	return (
		<>
			<div class="w-3/4 grid gap-2 text-left mb-36">
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
					/>
					<button
						type="button"
						id="confirm-title"
						class="w-12 h-full absolute max-phone:relative max-phone:w-full max-phone:h-4 *:max-phone:w-5 flex justify-center items-center p-3 right-0 bg-[--text-color] text-[--bg-color] hover:text-[--orange] hover:transition-[color] hover:duration-[0.6s] hover:ease-[cubic-bezier(0,0,0.04,0.65)]"
						onClick$={$startBlog}
					>
						<img src="/Icons/CheckIcon.svg" alt="Check mark icon" />
					</button>
				</label>
				<span id="errorInput" class="text-red-400" aria-label="erro no input" />
			</div>
		</>
	);
});
