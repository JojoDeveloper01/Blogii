import { component$ } from "@builder.io/qwik";

export const AskAuthentication = component$(() => {
    return (
        <span id="errorInput" class="text-red-400">
            <button
                class="link"
                onClick$={() => (document.getElementById("authModalMoreBlogs") as HTMLDialogElement)?.showModal()}
            >
                <span>Inicie sessão</span>
                <span class="text-red-400"> / </span>
                <span>Crie uma conta</span>
            </button>
        </span>)
})