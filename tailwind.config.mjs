/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				primary: 'hsl(var(--primary-hsl) / <alpha-value>)',
				secondary: 'hsl(var(--secondary-hsl) / <alpha-value>)',
			}
		}
	},
	plugins: [],
}