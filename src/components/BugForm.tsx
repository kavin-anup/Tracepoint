'use client'

import { useState, useEffect } from 'react'
import { Database } from '@/lib/supabase'
import EditableDropdown from './EditableDropdown'

type Bug = Database['public']['Tables']['bugs']['Row']

interface BugFormProps {
  projectId: string
  bug?: Bug
  onSubmit: (bugData: Omit<Bug, 'id' | 'created_at' | 'updated_at' | 'date_added'>) => void
  onCancel: () => void
}

// Default dropdown options (cannot be deleted)
const DEFAULT_PORTAL_OPTIONS = ['Admin Panel', 'Customer Side']
const DEFAULT_PRIORITY_OPTIONS = ['Minor', 'Medium', 'Major', 'Critical']
const DEFAULT_STATUS_OPTIONS = ['Open', 'In Progress', 'Ready for QA', 'Closed', 'Reopened', 'Not a Bug', 'Needs Clarification', 'Out of Scope']
const DEFAULT_ASSIGNED_TO_OPTIONS = ['Developer', 'Frontend', 'Backend']

// Helper functions to manage custom options in localStorage (per project)
const getCustomOptions = (key: string, projectId: string): string[] => {
  if (typeof window === 'undefined') return []
  const projectKey = `${key}_${projectId}`
  const stored = localStorage.getItem(projectKey)
  return stored ? JSON.parse(stored) : []
}

const saveCustomOptions = (key: string, projectId: string, options: string[]) => {
  if (typeof window !== 'undefined') {
    const projectKey = `${key}_${projectId}`
    localStorage.setItem(projectKey, JSON.stringify(options))
  }
}

export default function BugForm({ projectId, bug, onSubmit, onCancel }: BugFormProps) {
  const [formData, setFormData] = useState({
    bug_id: '',
    portal: 'Customer Side',
    priority: 'Minor',
    module_feature: '',
    bug_description: '',
    status: 'Open',
    assigned_to: 'Developer',
    bug_link: '',
    client_notes: '',
    developer_notes: ''
  })

  // Custom options state
  const [customPortalOptions, setCustomPortalOptions] = useState<string[]>([])
  const [customPriorityOptions, setCustomPriorityOptions] = useState<string[]>([])
  const [customStatusOptions, setCustomStatusOptions] = useState<string[]>([])
  const [customAssignedToOptions, setCustomAssignedToOptions] = useState<string[]>([])

  // Load custom options from localStorage on mount (project-specific)
  useEffect(() => {
    setCustomPortalOptions(getCustomOptions('custom_portal_options', projectId))
    setCustomPriorityOptions(getCustomOptions('custom_priority_options', projectId))
    setCustomStatusOptions(getCustomOptions('custom_status_options', projectId))
    setCustomAssignedToOptions(getCustomOptions('custom_assigned_to_options', projectId))
  }, [projectId])

  useEffect(() => {
    if (bug) {
      setFormData({
        bug_id: bug.bug_id,
        portal: bug.portal,
        priority: bug.priority,
        module_feature: bug.module_feature || '',
        bug_description: bug.bug_description || '',
        status: bug.status,
        assigned_to: bug.assigned_to,
        bug_link: bug.bug_link || '',
        client_notes: bug.client_notes || '',
        developer_notes: bug.developer_notes || ''
      })
    }
  }, [bug])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      project_id: projectId,
      bug_id: formData.bug_id,
      portal: formData.portal,
      priority: formData.priority,
      module_feature: formData.module_feature || null,
      bug_description: formData.bug_description || null,
      status: formData.status,
      assigned_to: formData.assigned_to,
      bug_link: formData.bug_link || null,
      client_notes: formData.client_notes || null,
      developer_notes: formData.developer_notes || null
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Handlers for custom options (project-specific)
  const handleAddPortalOption = (option: string) => {
    const updated = [...customPortalOptions, option]
    setCustomPortalOptions(updated)
    saveCustomOptions('custom_portal_options', projectId, updated)
  }

  const handleRemovePortalOption = (option: string) => {
    const updated = customPortalOptions.filter(opt => opt !== option)
    setCustomPortalOptions(updated)
    saveCustomOptions('custom_portal_options', projectId, updated)
  }

  const handleAddPriorityOption = (option: string) => {
    const updated = [...customPriorityOptions, option]
    setCustomPriorityOptions(updated)
    saveCustomOptions('custom_priority_options', projectId, updated)
  }

  const handleRemovePriorityOption = (option: string) => {
    const updated = customPriorityOptions.filter(opt => opt !== option)
    setCustomPriorityOptions(updated)
    saveCustomOptions('custom_priority_options', projectId, updated)
  }

  const handleAddStatusOption = (option: string) => {
    const updated = [...customStatusOptions, option]
    setCustomStatusOptions(updated)
    saveCustomOptions('custom_status_options', projectId, updated)
  }

  const handleRemoveStatusOption = (option: string) => {
    const updated = customStatusOptions.filter(opt => opt !== option)
    setCustomStatusOptions(updated)
    saveCustomOptions('custom_status_options', projectId, updated)
  }

  const handleAddAssignedToOption = (option: string) => {
    const updated = [...customAssignedToOptions, option]
    setCustomAssignedToOptions(updated)
    saveCustomOptions('custom_assigned_to_options', projectId, updated)
  }

  const handleRemoveAssignedToOption = (option: string) => {
    const updated = customAssignedToOptions.filter(opt => opt !== option)
    setCustomAssignedToOptions(updated)
    saveCustomOptions('custom_assigned_to_options', projectId, updated)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="backdrop-blur-md bg-white/10 rounded-lg shadow-xl border border-white/20 max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-white/20 flex-shrink-0">
          <h2 className="text-2xl font-semibold text-white">
            {bug ? 'Edit Bug' : 'Report New Bug'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
          <div className="space-y-4 p-6 overflow-y-auto flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bug ID - Read only if editing */}
            {bug && (
              <div>
                <label htmlFor="bug_id" className="block text-sm font-medium text-gray-300 mb-2">
                  Bug ID
                </label>
                <input
                  type="text"
                  id="bug_id"
                  name="bug_id"
                  value={formData.bug_id}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-gray-400 cursor-not-allowed"
                  readOnly
                />
              </div>
            )}
            
            {/* Portal */}
            <EditableDropdown
              id="portal"
              name="portal"
              label="Portal"
              value={formData.portal}
              onChange={handleChange}
              defaultOptions={DEFAULT_PORTAL_OPTIONS}
              customOptions={customPortalOptions}
              onAddOption={handleAddPortalOption}
              onRemoveOption={handleRemovePortalOption}
              required
            />

            {/* Priority */}
            <EditableDropdown
              id="priority"
              name="priority"
              label="Priority"
              value={formData.priority}
              onChange={handleChange}
              defaultOptions={DEFAULT_PRIORITY_OPTIONS}
              customOptions={customPriorityOptions}
              onAddOption={handleAddPriorityOption}
              onRemoveOption={handleRemovePriorityOption}
              required
            />

            {/* Status */}
            <EditableDropdown
              id="status"
              name="status"
              label="Status"
              value={formData.status}
              onChange={handleChange}
              defaultOptions={DEFAULT_STATUS_OPTIONS}
              customOptions={customStatusOptions}
              onAddOption={handleAddStatusOption}
              onRemoveOption={handleRemoveStatusOption}
              required
            />

            {/* Assigned To */}
            <EditableDropdown
              id="assigned_to"
              name="assigned_to"
              label="Assigned To"
              value={formData.assigned_to}
              onChange={handleChange}
              defaultOptions={DEFAULT_ASSIGNED_TO_OPTIONS}
              customOptions={customAssignedToOptions}
              onAddOption={handleAddAssignedToOption}
              onRemoveOption={handleRemoveAssignedToOption}
              required
            />
          </div>

          {/* Module / Feature */}
          <div>
            <label htmlFor="module_feature" className="block text-sm font-medium text-gray-300 mb-2">
              Module / Feature
            </label>
            <input
              type="text"
              id="module_feature"
              name="module_feature"
              value={formData.module_feature}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white placeholder-gray-400"
              placeholder="Mention location where the bug was found"
            />
          </div>

          {/* Bug Description */}
          <div>
            <label htmlFor="bug_description" className="block text-sm font-medium text-gray-300 mb-2">
              Bug Description
            </label>
            <textarea
              id="bug_description"
              name="bug_description"
              value={formData.bug_description}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white placeholder-gray-400"
              placeholder="Detailed description of the issue"
              rows={3}
            />
          </div>

          {/* Bug Link */}
          <div>
            <label htmlFor="bug_link" className="block text-sm font-medium text-gray-300 mb-2">
              Bug Link
            </label>
            <input
              type="text"
              id="bug_link"
              name="bug_link"
              value={formData.bug_link}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white placeholder-gray-400"
              placeholder="Paste URL or exact location of the bug"
            />
          </div>

          {/* Client Notes */}
          <div>
            <label htmlFor="client_notes" className="block text-sm font-medium text-gray-300 mb-2">
              Client Notes
            </label>
            <textarea
              id="client_notes"
              name="client_notes"
              value={formData.client_notes}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white placeholder-gray-400"
              placeholder="Add client notes, links, or additional context"
              rows={3}
            />
          </div>

          {/* Developer Notes */}
          <div>
            <label htmlFor="developer_notes" className="block text-sm font-medium text-gray-300 mb-2">
              Developer Notes
            </label>
            <textarea
              id="developer_notes"
              name="developer_notes"
              value={formData.developer_notes}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white placeholder-gray-400"
              placeholder="Add technical notes, workarounds, or solutions"
              rows={3}
            />
          </div>
          </div>
          
          <div className="flex justify-end space-x-3 p-6 border-t border-white/20 flex-shrink-0">
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
              {bug ? 'Update Bug' : 'Create Bug'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}