import { component$ } from "@builder.io/qwik";

export const AskAuthentication = component$(({ className }: { className?: string }) => {
    return (
        <button
            id="errorInput"
            class={`ml-2 font-bold underline ${className ?? ""}`}
            onClick$={() => (document.getElementById("authModalMoreBlogs") as HTMLDialogElement)?.showModal()}
        >
            <span>Get started</span>
        </button>
    )
})