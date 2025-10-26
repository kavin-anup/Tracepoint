'use client'

import { useState } from 'react'

interface EditableDropdownProps {
  id: string
  name: string
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  defaultOptions: string[]
  customOptions: string[]
  onAddOption: (option: string) => void
  onRemoveOption: (option: string) => void
  required?: boolean
}

export default function EditableDropdown({
  id,
  name,
  label,
  value,
  onChange,
  defaultOptions,
  customOptions,
  onAddOption,
  onRemoveOption,
  required = false
}: EditableDropdownProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [newOption, setNewOption] = useState('')
  const [showManageModal, setShowManageModal] = useState(false)

  const handleAddOption = () => {
    if (newOption.trim() && !defaultOptions.includes(newOption.trim()) && !customOptions.includes(newOption.trim())) {
      onAddOption(newOption.trim())
      setNewOption('')
      setShowAddModal(false)
    }
  }

  const allOptions = [...defaultOptions, ...customOptions]

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">
        {label} {required && '*'}
      </label>
      <div className="flex gap-2">
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white cursor-pointer"
          style={{
            colorScheme: 'dark'
          }}
          required={required}
        >
          {allOptions.map(option => (
            <option key={option} value={option} className="bg-gray-900 text-white hover:bg-[#1e316d] py-2">{option}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg"
          title="Add new option"
        >
          +
        </button>
        {customOptions.length > 0 && (
          <button
            type="button"
            onClick={() => setShowManageModal(true)}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg"
            title="Manage custom options"
          >
            ⚙
          </button>
        )}
      </div>

      {/* Add Option Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
          <div className="backdrop-blur-md bg-white/10 rounded-lg shadow-xl border border-white/20 max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Add New {label} Option
            </h3>
            <input
              type="text"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white placeholder-gray-400 mb-4"
              placeholder="Enter new option"
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false)
                  setNewOption('')
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddOption}
                className="px-4 py-2 bg-[#1e316d] hover:bg-[#2a4494] text-white rounded-lg font-medium transition-colors shadow-lg"
                disabled={!newOption.trim()}
              >
                Add Option
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Options Modal */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
          <div className="backdrop-blur-md bg-white/10 rounded-lg shadow-xl border border-white/20 max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Manage {label} Options
            </h3>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Default Options (Cannot be removed)</h4>
              <div className="space-y-1">
                {defaultOptions.map(option => (
                  <div key={option} className="px-3 py-2 bg-white/5 border border-white/10 rounded text-gray-300 text-sm">
                    {option}
                  </div>
                ))}
              </div>
            </div>

            {customOptions.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Custom Options</h4>
                <div className="space-y-1">
                  {customOptions.map(option => (
                    <div key={option} className="flex justify-between items-center px-3 py-2 bg-blue-900/30 border border-blue-500/30 rounded text-white text-sm">
                      <span>{option}</span>
                      <button
                        type="button"
                        onClick={() => onRemoveOption(option)}
                        className="text-red-400 hover:text-red-300 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

