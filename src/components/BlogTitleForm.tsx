import { component$, useResource$, $, Resource } from "@builder.io/qwik";
import { getCollection } from "astro:content";
import { TitleInput } from "./TitleInput";
import type { BlogData } from "@lib/types";

export const BlogTitleForm = component$(() => {
    // Carregar os blogs usando useResource$
    const blogData = useResource$<BlogData[]>(async () => {
        return await getCollection("blog");
    });

    return (
        <div class="w-3/4 grid gap-2 text-left">
            <TitleInput />

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
