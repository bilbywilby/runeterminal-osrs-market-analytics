/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['Inter', 'sans-serif'],
  			mono: ['JetBrains Mono', 'Fira Code', 'monospace']
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			terminal: {
  				black: '#050505',
  				green: '#39ff14',
  				amber: '#ffb000',
  				red: '#ff3131',
  				blue: '#00f3ff'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			ring: 'hsl(var(--ring))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			}
  		},
  		keyframes: {
  			'crt-flicker': {
  				'0%': { opacity: '0.97' },
  				'5%': { opacity: '0.95' },
  				'10%': { opacity: '0.99' },
  				'15%': { opacity: '0.93' },
  				'20%': { opacity: '0.98' },
  				'100%': { opacity: '1' }
  			},
  			'marquee': {
  				'0%': { transform: 'translateX(0)' },
  				'100%': { transform: 'translateX(-50%)' }
  			},
  			'text-glitch': {
  				'0%, 100%': { transform: 'translate(0)' },
  				'20%': { transform: 'translate(-2px, 2px)' },
  				'40%': { transform: 'translate(-2px, -2px)' },
  				'60%': { transform: 'translate(2px, 2px)' },
  				'80%': { transform: 'translate(2px, -2px)' }
  			}
  		},
  		animation: {
  			'crt-flicker': 'crt-flicker 0.15s infinite',
  			'marquee': 'marquee 30s linear infinite',
  			'text-glitch': 'text-glitch 2s cubic-bezier(.25,.46,.45,.94) infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")]
}