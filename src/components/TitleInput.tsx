import { component$, $, useSignal } from "@builder.io/qwik";
import { ErrorMessage } from "./ErrorMessage";
import { AskAuthentication } from "./AskAuthentication";
import { TitleInputBase } from './shared/TitleInputBase';
import { startBlog, processInput } from "@lib/utils";

interface TitleInputProps {
	hasBlogs: boolean,	
	isAuthorized: boolean
}

export const TitleInput = component$(({ hasBlogs, isAuthorized }: TitleInputProps) => {
	const title = useSignal("");
	const showError = useSignal(false);
	const message = useSignal("");
	const disableButton = useSignal(true);
	const messageToLoginOrCreateAccount = useSignal(false);

	const handleStartBlog = $(async () => {
		const blogResult = await startBlog(title.value, (show, msg) => {
			showError.value = show;
			message.value = msg;
		});
		
		if (blogResult && typeof window !== 'undefined') {
            window.location.href = blogResult.path;
        }
	});

	const handleProcessInput = $(async (inputValue: string) => {
		title.value = inputValue.trim();
		return await processInput(title.value, isAuthorized, hasBlogs, (state) => {
			showError.value = state.error;
			message.value = state.msg;
			messageToLoginOrCreateAccount.value = state.login;
			disableButton.value = state.disabled;
		});
	});

	// Função para lidar com o evento de input
	const handleInput = $(async (newValue: string) => {
		await handleProcessInput(newValue);
	});

	return (
		<div class="w-3/4 grid gap-2 text-left">
			<label class="relative flex max-phone:flex-col items-center overflow-hidden border rounded-xl">
				<TitleInputBase
					value={title}
					onInput$={handleInput}
					onEnter$={async () => {
						const isValid = await handleProcessInput(title.value);
						if (isValid) {
							handleStartBlog();
						}
					}}
					className="w-full px-4 py-2 bg-transparent rounded-xl text-[1vw] max-phone:text-[3vw]"
					placeholder="Start your idea here..."
				/>
				<button
					type="button"
					id="confirm-title"
					class="w-12 h-full absolute max-phone:relative max-phone:w-full max-phone:h-4 flex justify-center items-center p-3 right-0 text-[--bg-color] hover:text-[--orange]"
					onClick$={() => handleStartBlog()}
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
