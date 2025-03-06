import { component$ } from "@builder.io/qwik";

interface ErrorMessageProps {
    showError: { value: boolean };
}

export const ErrorMessage = component$(({ showError }: ErrorMessageProps) => {
    return (
        <div id="errorMessage" class={`text-red-400 ${showError.value ? "block" : "hidden"}`} aria-label="Erro no input">
            Já tem um blog ativo.
            <button
                id="modalLogin"
                class="link"
                onClick$={() => (document.getElementById('modalLogin') as HTMLDialogElement)?.showModal()}
            >
                Inicie sessão
            </button>
            ou
            <button
                id="modalRegister"
                class="link"
                onClick$={() => (document.getElementById('modalRegister') as HTMLDialogElement)?.showModal()}
            >
                Crie uma conta
            </button>
        </div>
    );
});
