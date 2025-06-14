import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import qwikdev from "@qwikdev/astro";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
    site: "https://myblogii.com",
    integrations: [mdx(), sitemap(), tailwind(), qwikdev()],

    output: "server",
    server: {
        host: "0.0.0.0",
    },
    adapter: node({
        mode: "standalone"
    }),

    vite: {
        server: {
            watch: {
                // Isso torna a observação de arquivos mais agressiva
                usePolling: true,
                interval: 500,
            },
        },
    },
});