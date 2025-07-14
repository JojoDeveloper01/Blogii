/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				primary: 'hsl(var(--primary-hsl) / <alpha-value>)',
				secondary: 'hsl(var(--secondary-hsl) / <alpha-value>)',
			},
			keyframes: {
				'notification': {
					'0%': { opacity: '0', transform: 'translateY(1rem)' },
					'15%': { opacity: '1', transform: 'translateY(0)' },
					'85%': { opacity: '1', transform: 'translateY(0)' },
					'100%': { opacity: '0', transform: 'translateY(1rem)' }
				},
				'progress': {
					'0%': { width: '100%' },
					'100%': { width: '0%' }
				}
			},
			animation: {
				'notification': 'notification 3s cubic-bezier(.36,.07,.19,.97) both',
				'progress': 'progress 3s linear both'
			}
		}
	},
	plugins: [require('@tailwindcss/typography')],
}