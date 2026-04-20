/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['var(--font-ui)'],
        reading: ['var(--font-reading)'],
        mono:    ['var(--font-mono)'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        // Direct token access — use these in new components.
        bg:           'hsl(var(--bg))',
        'surface-1':  'hsl(var(--surface-1))',
        'surface-2':  'hsl(var(--surface-2))',
        'surface-inset': 'hsl(var(--surface-inset))',
        border:       'hsl(var(--border))',
        'border-strong': 'hsl(var(--border-strong))',
        'text-primary':   'hsl(var(--text-primary))',
        'text-secondary': 'hsl(var(--text-secondary))',
        'text-muted':     'hsl(var(--text-muted))',
        accent:       'hsl(var(--accent))',
        'accent-hover': 'hsl(var(--accent-hover))',
        success:      'hsl(var(--success))',
        warning:      'hsl(var(--warning))',
        danger:       'hsl(var(--danger))',
        streak:       'hsl(var(--streak))',

        // Shadcn compatibility — legacy components keep working.
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        card:        { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover:     { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary:     { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary:   { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted:       { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      transitionDuration: {
        150: '150ms',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'slide-up': {
          from: { opacity: 0, transform: 'translateY(6px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in':  'fade-in 160ms ease-out',
        'slide-up': 'slide-up 200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
