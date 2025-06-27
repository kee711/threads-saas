/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: {
					DEFAULT: 'hsl(var(--background))',
					dark: '#111111'
				},
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				"spin-around": {
					"0%": {
						transform: "translateZ(0) rotate(0)",
					},
					"15%, 35%": {
						transform: "translateZ(0) rotate(90deg)",
					},
					"65%, 85%": {
						transform: "translateZ(0) rotate(270deg)",
					},
					"100%": {
						transform: "translateZ(0) rotate(360deg)",
					},
				},
				"shimmer-slide": {
					to: {
						transform: "translate(calc(100cqw - 100%), 0)",
					},
				},
				shimmer: {
					'0%': { transform: 'translateX(-100%) skewX(-12deg)' },
					'100%': { transform: 'translateX(200%) skewX(-12deg)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				"shimmer-slide":
					"shimmer-slide var(--speed) ease-in-out infinite alternate",
				"spin-around": "spin-around calc(var(--speed) * 2) infinite linear",
				shimmer: 'shimmer 1.5s infinite'
			},
			// backgroundImage: {
			// 	'dot-pattern': '`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'%3E%3Cg stroke-width='3.5' stroke='hsla(0, 0%25, 100%25, 1.00)' fill='none'%3E%3Ccircle r='4.29' cx='0' cy='0' fill='hsla(0, 0%25, 100%25, 1.00)' stroke='none'/%3E%3Ccircle r='4.29' cx='400' cy='0' fill='hsla(0, 0%25, 100%25, 1.00)' stroke='none'/%3E%3Ccircle r='4.29' cx='800' cy='0' fill='hsla(0, 0%25, 100%25, 1.00)' stroke='none'/%3E%3Ccircle r='4.29' cx='0' cy='400' fill='hsla(0, 0%25, 100%25, 1.00)' stroke='none'/%3E%3Ccircle r='4.29' cx='400' cy='400' fill='hsla(0, 0%25, 100%25, 1.00)' stroke='none'/%3E%3Ccircle r='4.29' cx='800' cy='400' fill='hsla(0, 0%25, 100%25, 1.00)' stroke='none'/%3E%3Ccircle r='4.29' cx='0' cy='800' fill='hsla(0, 0%25, 100%25, 1.00)' stroke='none'/%3E%3Ccircle r='4.29' cx='400' cy='800' fill='hsla(0, 0%25, 100%25, 1.00)' stroke='none'/%3E%3Ccircle r='4.29' cx='800' cy='800' fill='hsla(0, 0%25, 100%25, 1.00)' stroke='none'/%3E%3C/g%3E%3C/svg%3E")`',
			// 		'dot-pattern-light': '`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'%3E%3Cg stroke-width='3.5' stroke='hsla(215, 16%25, 47%25, 1.00)' fill='none'%3E%3Ccircle r='4.29' cx='0' cy='0' fill='hsla(215, 16%25, 47%25, 1.00)' stroke='none'/%3E%3Ccircle r='4.29' cx='400' cy='0' fill='hsla(215, 16%25, 47%25, 1.00)' stroke='none'/%3E%3Ccircle r='4.29' cx='800' cy='0' fill='hsla(215, 16%25, 47%25, 1.00)' stroke='none'/%3E%3Ccircle r='4.29' cx='0' cy='400' fill='hsla(215, 16%25, 47%25, 1.00)' stroke='none'/%3E%3Ccircle r='4.29' cx='400' cy='400' fill='hsla(215, 16%25, 47%25, 1.00)' stroke='none'/%3E%3Ccircle r='4.29' cx='800' cy='400' fill='hsla(215, 16%25, 47%25, 1.00)' stroke='none'/%3E%3Ccircle r='4.29' cx='0' cy='800' fill='hsla(215, 16%25, 47%25, 1.00)' stroke='none'/%3E%3Ccircle r='4.29' cx='400' cy='800' fill='hsla(215, 16%25, 47%25, 1.00)' stroke='none'/%3E%3Ccircle r='4.29' cx='800' cy='800' fill='hsla(215, 16%25, 47%25, 1.00)' stroke='none'/%3E%3C/g%3E%3C/svg%3E")`',
			// 	'grid-pattern': '`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'%3E%3Cg stroke-width='3.5' stroke='hsla(0, 0%25, 100%25, 1.00)' fill='none'%3E%3Crect x='0' y='0' width='100' height='100' fill='hsla(0, 0%25, 100%25, 1.00)' stroke='none'/%3E%3C/g%3E%3C/svg%3E")`',
			// 		'grid-pattern-light': '`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'%3E%3Cg stroke-width='3.5' stroke='hsla(215, 16%25, 47%25, 1.00)' fill='none'%3E%3Crect x='0' y='0' width='100' height='100' fill='hsla(215, 16%25, 47%25, 1.00)' stroke='none'/%3E%3C/g%3E%3C/svg%3E")`',
			// },
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		require('tailwind-scrollbar-hide')
	],
} 