import { component$, $, Slot } from "@builder.io/qwik";
import { icons } from "./Editing/icons";

interface ErrorMessageProps {
    showError: { value: boolean };
    showFloating: boolean;
    className?: string;
}

export const ErrorMessage = component$(({ className, showError, showFloating }: ErrorMessageProps) => {
    // Mensagem simples sem animações
    if (!showFloating) {
        return (
            <div
                class={`flex items-center gap-2 text-[--error] ${className ?? ""}`}
                hidden={!showError.value}
            >
                <Slot />
            </div>
        );
    }

    return (
        <div
            key={showError.value ? Date.now() : 'hidden'}
            class={`
                fixed bottom-4 right-4 z-[100] flex items-center gap-3 max-w-md bg-[--error]
                rounded-lg shadow-lg overflow-hidden
                ${showError.value ? 'animate-notification' : 'opacity-0 translate-y-4 pointer-events-none'}
                ${className ?? ""}
            `}
        >
            {/* Container principal */}
            <div class="relative">
                {/* Barra de progresso animada com CSS */}
                <div
                    class={`absolute bottom-0 left-0 h-1 bg-white/20 ${showError.value ? 'animate-progress' : ''}`}
                    style={{ width: showError.value ? undefined : '100%' }}
                />

                {/* Conteúdo */}
                <div class="p-4">
                    <div class="text-white/90">
                        <Slot />
                    </div>
                </div>
            </div>
        </div>
    );
});
