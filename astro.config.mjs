// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import tailwind from "@astrojs/tailwind";
import node from "@astrojs/node";

import qwikdev from "@qwikdev/astro";

// https://astro.build/config
export default defineConfig({
    site: "http://localhost:4321",
    integrations: [mdx(), sitemap(), tailwind(), qwikdev()],

    output: "server",
    server: {
        host: "0.0.0.0",
    },
    adapter: node({
        mode: "standalone",
    }),
});