import { component$ } from "@builder.io/qwik";

interface ErrorMessageProps {
    showError: { value: boolean };
    message: string;
}

export const ErrorMessage = component$(({ showError, message }: ErrorMessageProps) => {
    return (
        <span id="errorMessage" class={`text-[--error] ${showError.value ? "inline" : "hidden"}`} aria-label="Erro no input">
            {message}
        </span>
    );
});
