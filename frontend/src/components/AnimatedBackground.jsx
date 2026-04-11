import React from 'react'

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <svg
        className="w-full h-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0fdf4" stopOpacity="1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
          </linearGradient>
          
          <linearGradient id="darkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="1" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="1" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background gradient */}
        <rect width="1200" height="800" fill="url(#grad1)" />

        {/* Animated circles */}
        <circle cx="150" cy="100" r="80" fill="#10b981" opacity="0.08" className="animate-float" />
        <circle cx="1050" cy="150" r="60" fill="#f97316" opacity="0.08" className="animate-float" style={{ animationDelay: '1s' }} />
        <circle cx="600" cy="650" r="100" fill="#0ea5e9" opacity="0.06" className="animate-float" style={{ animationDelay: '2s' }} />
        <circle cx="250" cy="500" r="70" fill="#a855f7" opacity="0.07" className="animate-float" style={{ animationDelay: '1.5s' }} />
        <circle cx="950" cy="600" r="90" fill="#f59e0b" opacity="0.08" className="animate-float" style={{ animationDelay: '2.5s' }} />

        {/* Animated leaf shapes (using circle abstractions) */}
        <path
          d="M 400 200 Q 420 180 440 200 Q 420 210 400 200"
          fill="#059669"
          opacity="0.1"
          className="animate-float"
          style={{ animationDelay: '0.5s' }}
        />
        <path
          d="M 800 400 Q 820 380 840 400 Q 820 410 800 400"
          fill="#059669"
          opacity="0.1"
          className="animate-float"
          style={{ animationDelay: '1.2s' }}
        />

        {/* Decorative dots */}
        <circle cx="200" cy="300" r="4" fill="#10b981" opacity="0.6" />
        <circle cx="1000" cy="250" r="3" fill="#f97316" opacity="0.6" />
        <circle cx="600" cy="100" r="5" fill="#0ea5e9" opacity="0.5" />
        <circle cx="400" cy="700" r="3" fill="#a855f7" opacity="0.6" />
        <circle cx="900" cy="350" r="4" fill="#f59e0b" opacity="0.6" />
      </svg>
    </div>
  )
}

export default AnimatedBackground
