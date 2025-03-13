import { component$ } from "@builder.io/qwik";

interface ErrorMessageProps {
    showError: { value: boolean };
    message: string;
}

export const ErrorMessage = component$(({ showError, message }: ErrorMessageProps) => {
    return (
        <div id="errorMessage" class={`text-red-400 ${showError.value ? "block" : "hidden"}`} aria-label="Erro no input">
            {message}
        </div>
    );
});
