import React, { useState, useEffect } from 'react'

const DarkModeToggle = () => {
    const [isDark, setIsDark] = useState(false)

    useEffect(() => {
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setIsDark(true)
        document.documentElement.classList.add('dark')
        } else if (localStorage.getItem('theme') === 'dark') {
        setIsDark(true)
        document.documentElement.classList.add('dark')
        }
    }, [])

    const toggleDarkMode = () => {
        setIsDark(!isDark)
        if (!isDark) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
        } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
        }
    }

    return (
        <button
        onClick={toggleDarkMode}
        className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-gradient-to-br from-dhara-green to-dhara-emerald text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all"
        title="Toggle dark mode"
        >
        {isDark ? (
        // 🌞 Sun (when dark mode ON → show sun to switch back)
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5" />
            <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
        ) : (
        // 🌙 Moon (when light mode → show moon)
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
        )}
        </button>
    )
}

export default DarkModeToggle
