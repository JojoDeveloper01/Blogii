import { component$ } from "@builder.io/qwik";

export const AskAuthentication = component$(() => {
    return (
        <span id="errorInput" class="text-red-400">
            <span>Já tem um blog ativo. </span>
            <button
                id="modalLogin"
                class="link"
                onClick$={() => (document.getElementById('modalLogin') as HTMLDialogElement)?.showModal()}
            >
                Inicie sessão
            </button>
            <span> ou </span>
            <button
                id="modalRegister"
                class="link"
                onClick$={() => (document.getElementById('modalRegister') as HTMLDialogElement)?.showModal()}
            >
                Crie uma conta
            </button>
        </span>)
})