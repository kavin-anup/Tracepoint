'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if already authenticated
    const authStatus = localStorage.getItem('isAuthenticated')
    if (authStatus === 'true') {
      router.push('/')
    } else {
      setCheckingAuth(false)
    }
  }, [router])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check credentials
    if (username === 'kavin@boostmysites.com' && password === 'TracepoinT777') {
      // Store login state
      localStorage.setItem('isAuthenticated', 'true')
      router.push('/')
    } else {
      setError('Invalid username or password')
    }
  }

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-xl text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Background Image with Opacity */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/background.jpg)',
          opacity: 0.5
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="backdrop-blur-md bg-white/10 rounded-lg shadow-xl border border-white/20 max-w-md w-full p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="Tracepoint Logo" 
              className="w-32 h-32"
            />
          </div>
          
          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-3">
              Welcome to Tracepoint
            </h1>
            <p className="text-gray-300">
              Manage your project features and bugs effortlessly.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Admin Username:
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white placeholder-gray-400"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Access Password:
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white placeholder-gray-400"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#1e316d] hover:bg-[#2a4494] text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-lg mt-6"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

