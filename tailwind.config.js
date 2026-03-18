/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          // Nuansa Medieval-Noir
          background: '#0f172a', // slate-900 sebagai dasar gelap
          accent: '#f59e0b',     // amber-500 untuk elemen penting
          surface: '#1e293b',    // slate-800 untuk card/UI element
        },
      },
    },
    plugins: [],
  }