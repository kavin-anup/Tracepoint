'use client'

import { useState } from 'react'

interface ProjectFormProps {
  onSubmit: (name: string, description: string) => void
  onCancel: () => void
}

export default function ProjectForm({ onSubmit, onCancel }: ProjectFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit(name.trim(), description.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="backdrop-blur-md bg-white/10 rounded-lg shadow-xl border border-white/20 max-w-md w-full p-6">
        <h2 className="text-2xl font-semibold text-white mb-6">Create New Project</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white placeholder-gray-400"
              placeholder="Enter project name"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white placeholder-gray-400"
              placeholder="Enter project description (optional)"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#1e316d] hover:bg-[#2a4494] text-white rounded-lg font-medium transition-colors shadow-lg"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
