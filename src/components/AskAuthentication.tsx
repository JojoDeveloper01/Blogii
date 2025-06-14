import { component$ } from "@builder.io/qwik";

export const AskAuthentication = component$(() => {
    return (
        <button
            id="errorInput"
            class="ml-2 text-[--secondary] font-bold underline"
            onClick$={() => (document.getElementById("authModalMoreBlogs") as HTMLDialogElement)?.showModal()}
        >
            <span>Get started</span>
        </button>
    )
})