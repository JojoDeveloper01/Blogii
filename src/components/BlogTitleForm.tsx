import { component$, useSignal, useResource$, $, Resource } from "@builder.io/qwik";
import { getCollection } from "astro:content";
import { TitleInput } from "./TitleInput";
import { ErrorMessage } from "./ErrorMessage";

export const BlogTitleForm = component$(() => {
    const title = useSignal("");
    const showError = useSignal(false);
    const disableButton = useSignal(false);

    // Carregar os blogs usando useResource$
    const blogData = useResource$<any[]>(async () => {
        return await getCollection("blog");
    });

    const handleInput = $(async (event: Event) => {
        const inputValue = (event.target as HTMLInputElement).value.trim();
        title.value = inputValue;

        // Esperar a resolução dos blogs antes de verificar a existência do título
        const blogs = await blogData.value;
        if (blogs?.some(blog => blog.data.title === inputValue)) {
            disableButton.value = true;
            showError.value = true;
        } else {
            disableButton.value = inputValue.length < 3;
            showError.value = false;
        }
    });

    return (
        <div class="w-3/4 grid gap-2 text-left">
            <TitleInput {...{ title, handleInput, disableButton }} />
            <ErrorMessage {...{ showError }} />

            {/* ✅ Usa o Resource apenas para garantir que os dados carreguem, sem exibir nada */}
            <Resource
                value={blogData}
                onPending={() => null}  // ⚡ Não exibe nada enquanto carrega
                onResolved={() => null} // ⚡ Não exibe nada quando carregado
                onRejected={(error) => <p>Erro ao carregar blogs: {error.message}</p>}
            />
        </div>
    );
});
