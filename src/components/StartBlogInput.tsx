import { component$, $, useSignal } from "@builder.io/qwik";
import { ErrorMessage } from "./ErrorMessage";
import { AskAuthentication } from "./AskAuthentication";
import { TitleInputBase } from './shared/TitleInputBase';
import { startBlog, processInput } from "@/lib/utils";
import { icons } from "./Editing/icons";

interface StartBlogInputProps {
	hasBlogs: boolean,
	showFloating: boolean
	isAuthorized: boolean,
	userId: string,
	lang: string,
}

export const StartBlogInput = component$(({ hasBlogs, showFloating, isAuthorized, userId, lang }: StartBlogInputProps) => {
	const title = useSignal("");
	const showError = useSignal(false);
	const message = useSignal("");
	const disableButton = useSignal(true);
	const loginRegisterMessage = useSignal(false);

	const handleStartBlog = $(async () => {
		const blogResult = await startBlog(title.value, userId, isAuthorized, lang, (show, msg) => {
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
			loginRegisterMessage.value = state.login;
			disableButton.value = state.disabled;
		});
	});

	// Função para lidar com o evento de input
	const handleInput = $(async (newValue: string) => {
		await handleProcessInput(newValue);
	});

	return (
		<div class="grid gap-1">
			<div id="label-title" class="relative flex max-phone:flex-col items-center overflow-hidden border rounded-xl">
				<TitleInputBase
					value={title}
					onInput$={handleInput}
					onEnter$={async () => {
						const isValid = await handleProcessInput(title.value);
						if (isValid) {
							handleStartBlog();
						}
					}}
					placeholder="Start your idea here..."
				/>
				<button
					type="button"
					id="confirm-title"
					class="w-12 h-full absolute max-phone:relative max-phone:w-full max-phone:h-4 flex justify-center items-center p-3 right-0 text-white hover:text-[--orange]"
					onClick$={() => handleStartBlog()}
					disabled={disableButton.value}
				>
					<span dangerouslySetInnerHTML={icons.checkStart} />
				</button>
			</div>
			<div class="flex">
				<ErrorMessage
					showError={showError}
					showFloating={showFloating}
				>
					<div dangerouslySetInnerHTML={message.value} />
					{loginRegisterMessage.value && <AskAuthentication className="text-seocndary/100" />}
				</ErrorMessage>
			</div>
		</div>
	);
});
