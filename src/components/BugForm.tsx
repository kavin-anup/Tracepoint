'use client'

import { useState, useEffect } from 'react'
import { Database } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

type Bug = Database['public']['Tables']['bugs']['Row']

interface BugFormProps {
  projectId: string
  bug?: Bug
  onSubmit: (bugData: Omit<Bug, 'id' | 'created_at' | 'updated_at' | 'date_added'>) => void
  onCancel: () => void
}

type Attachment = {
  name: string
  url: string
  size: number
  type: string
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
    client_notes: '',
    developer_notes: ''
  })

  // Separate state for current (latest) notes being edited
  const [currentClientNote, setCurrentClientNote] = useState('')
  const [currentDeveloperNote, setCurrentDeveloperNote] = useState('')
  const [previousClientNotes, setPreviousClientNotes] = useState<Array<{note: string, timestamp: string}>>([])
  const [previousDeveloperNotes, setPreviousDeveloperNotes] = useState<Array<{note: string, timestamp: string}>>([])
  
  // Status history state
  const [statusHistory, setStatusHistory] = useState<Array<{status: string, timestamp: string}>>([])
  const [originalStatus, setOriginalStatus] = useState<string>('')

  // Custom options state
  const [customPortalOptions, setCustomPortalOptions] = useState<string[]>([])
  const [customPriorityOptions, setCustomPriorityOptions] = useState<string[]>([])
  const [customStatusOptions, setCustomStatusOptions] = useState<string[]>([])
  const [customAssignedToOptions, setCustomAssignedToOptions] = useState<string[]>([])
  
  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

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
        client_notes: '',
        developer_notes: ''
      })
      setExistingAttachments(bug.attachments || [])
      // Handle status history
      if (bug.status_history && Array.isArray(bug.status_history) && bug.status_history.length > 0) {
        setStatusHistory(bug.status_history)
      } else {
        // If no history exists, create initial entry from current status and date_added
        setStatusHistory([{
          status: bug.status,
          timestamp: bug.date_added || bug.created_at || new Date().toISOString()
        }])
      }
      setOriginalStatus(bug.status)
      // Handle notes - when editing, empty the textbox and move latest note to previous notes
      if (bug.client_notes) {
        if (Array.isArray(bug.client_notes) && bug.client_notes.length > 0) {
          const sorted = [...bug.client_notes].sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          // Empty textbox for editing, move latest note to previous
          setCurrentClientNote('')
          setPreviousClientNotes(sorted) // Include all notes (latest becomes previous)
        } else if (typeof bug.client_notes === 'string') {
          // Legacy format: move to previous notes, empty textbox
          setCurrentClientNote('')
          setPreviousClientNotes([{note: bug.client_notes, timestamp: new Date().toISOString()}])
        } else {
          setCurrentClientNote('')
          setPreviousClientNotes([])
        }
      } else {
        setCurrentClientNote('')
        setPreviousClientNotes([])
      }
      
      if (bug.developer_notes) {
        if (Array.isArray(bug.developer_notes) && bug.developer_notes.length > 0) {
          const sorted = [...bug.developer_notes].sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          // Empty textbox for editing, move latest note to previous
          setCurrentDeveloperNote('')
          setPreviousDeveloperNotes(sorted) // Include all notes (latest becomes previous)
        } else if (typeof bug.developer_notes === 'string') {
          // Legacy format: move to previous notes, empty textbox
          setCurrentDeveloperNote('')
          setPreviousDeveloperNotes([{note: bug.developer_notes, timestamp: new Date().toISOString()}])
        } else {
          setCurrentDeveloperNote('')
          setPreviousDeveloperNotes([])
        }
      } else {
        setCurrentDeveloperNote('')
        setPreviousDeveloperNotes([])
      }
    } else {
      setCurrentClientNote('')
      setCurrentDeveloperNote('')
      setPreviousClientNotes([])
      setPreviousDeveloperNotes([])
      setStatusHistory([])
      setOriginalStatus('')
    }
  }, [bug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploadingFiles(true)

    try {
      // Upload new files to Supabase Storage
      const uploadedFiles: Attachment[] = []
      
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${projectId}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('bug-attachments')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          alert(`Failed to upload ${file.name}`)
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('bug-attachments')
          .getPublicUrl(filePath)

        uploadedFiles.push({
          name: file.name,
          url: publicUrl,
          size: file.size,
          type: file.type
        })
      }

      // Combine existing attachments with newly uploaded files
      const allAttachments = [...existingAttachments, ...uploadedFiles]

      // Get the original latest notes to compare
      const originalClientLatest = bug && bug.client_notes && Array.isArray(bug.client_notes) && bug.client_notes.length > 0
        ? [...bug.client_notes].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
        : null
      const originalDeveloperLatest = bug && bug.developer_notes && Array.isArray(bug.developer_notes) && bug.developer_notes.length > 0
        ? [...bug.developer_notes].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
        : null

      // Start with previous notes (all existing notes when editing)
      let finalClientNotes = [...previousClientNotes]
      let finalDeveloperNotes = [...previousDeveloperNotes]

      // Handle client notes
      if (currentClientNote.trim()) {
        // User typed a new note, add it
        finalClientNotes.push({
          note: currentClientNote.trim(),
          timestamp: new Date().toISOString()
        })
      }

      // Handle developer notes
      if (currentDeveloperNote.trim()) {
        // User typed a new note, add it
        finalDeveloperNotes.push({
          note: currentDeveloperNote.trim(),
          timestamp: new Date().toISOString()
        })
      }

      // Sort by timestamp ascending (oldest first) for proper numbering (oldest = Note 1)
      finalClientNotes = finalClientNotes.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      finalDeveloperNotes = finalDeveloperNotes.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      // Handle status history - track changes
      let finalStatusHistory = [...statusHistory]
      const currentStatus = formData.status
      
      // Check if status has changed (for edits) or add initial status (for new bugs)
      if (bug) {
        // Editing: check if status changed from original
        if (currentStatus !== originalStatus) {
          finalStatusHistory.push({
            status: currentStatus,
            timestamp: new Date().toISOString()
          })
        }
      } else {
        // New bug: add initial status
        finalStatusHistory = [{
          status: currentStatus,
          timestamp: new Date().toISOString()
        }]
      }

    onSubmit({
      project_id: projectId,
      bug_id: formData.bug_id,
      portal: formData.portal,
      priority: formData.priority,
      module_feature: formData.module_feature || null,
      bug_description: formData.bug_description || null,
      status: formData.status,
      assigned_to: formData.assigned_to,
        client_notes: finalClientNotes.length > 0 ? finalClientNotes : null,
        developer_notes: finalDeveloperNotes.length > 0 ? finalDeveloperNotes : null,
        status_history: finalStatusHistory.length > 0 ? finalStatusHistory : null,
        attachments: allAttachments.length > 0 ? allAttachments : null
      })
      
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      alert('An error occurred while submitting the form')
    } finally {
      setUploadingFiles(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Combine default and custom options for dropdowns
  const allPortalOptions = [...DEFAULT_PORTAL_OPTIONS, ...customPortalOptions]
  const allPriorityOptions = [...DEFAULT_PRIORITY_OPTIONS, ...customPriorityOptions]
  const allStatusOptions = [...DEFAULT_STATUS_OPTIONS, ...customStatusOptions]
  const allAssignedToOptions = [...DEFAULT_ASSIGNED_TO_OPTIONS, ...customAssignedToOptions]

  // File handling functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setSelectedFiles(prev => [...prev, ...newFiles])
    }
  }

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExistingAttachment = async (attachment: Attachment) => {
    if (!confirm(`Are you sure you want to delete ${attachment.name}?`)) return

    try {
      // Extract file path from URL
      const urlParts = attachment.url.split('/bug-attachments/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        
        const { error } = await supabase.storage
          .from('bug-attachments')
          .remove([filePath])

        if (error) {
          console.error('Delete error:', error)
          alert('Failed to delete file')
          return
        }
      }

      setExistingAttachments(prev => prev.filter(a => a.url !== attachment.url))
    } catch (error) {
      console.error('Error deleting file:', error)
      alert('An error occurred while deleting the file')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatNoteDate = (timestamp: string): string => {
    const date = new Date(timestamp)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year}, ${hours}:${minutes}`
  }

  const formatStatusHistoryDate = (timestamp: string): string => {
    const date = new Date(timestamp)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2)
    return `${day}/${month}/${year}`
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
            <div>
              <label htmlFor="portal" className="block text-sm font-medium text-gray-300 mb-2">
                Portal *
              </label>
              <select
              id="portal"
              name="portal"
              value={formData.portal}
              onChange={handleChange}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white cursor-pointer"
                style={{ colorScheme: 'dark' }}
              required
              >
                {allPortalOptions.map(option => (
                  <option key={option} value={option} className="bg-gray-900 text-white">{option}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-300 mb-2">
                Priority *
              </label>
              <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white cursor-pointer"
                style={{ colorScheme: 'dark' }}
              required
              >
                {allPriorityOptions.map(option => (
                  <option key={option} value={option} className="bg-gray-900 text-white">{option}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">
                Status *
              </label>
              <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white cursor-pointer"
                style={{ colorScheme: 'dark' }}
              required
              >
                {allStatusOptions.map(option => (
                  <option key={option} value={option} className="bg-gray-900 text-white">{option}</option>
                ))}
              </select>
            </div>

            {/* Assigned To */}
            <div>
              <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-300 mb-2">
                Assigned To *
              </label>
              <select
              id="assigned_to"
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleChange}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white cursor-pointer"
                style={{ colorScheme: 'dark' }}
              required
              >
                {allAssignedToOptions.map(option => (
                  <option key={option} value={option} className="bg-gray-900 text-white">{option}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bug Title */}
          <div>
            <label htmlFor="module_feature" className="block text-sm font-medium text-gray-300 mb-2">
              Bug Title
            </label>
            <input
              type="text"
              id="module_feature"
              name="module_feature"
              value={formData.module_feature}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white placeholder-gray-400"
              placeholder="Enter a title for this bug"
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
              rows={5}
            />
          </div>

          {/* File Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Attach Reference Files
            </label>
            
            {/* File Upload Button */}
            <div className="mb-3">
              <label className="flex items-center justify-center w-full px-4 py-3 bg-white/5 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:bg-white/10 hover:border-white/30 transition-colors">
                <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm text-gray-300">Choose Files (Images, Videos, PDFs, Docs, etc.)</span>
            <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="*/*"
                />
              </label>
              <p className="mt-1 text-xs text-gray-400">You can select multiple files of any type up to 50MB</p>
            </div>

            {/* Display Selected Files (Not yet uploaded) */}
            {selectedFiles.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-2">Files to upload ({selectedFiles.length}):</p>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-purple-900/20 border border-purple-500/30 rounded-lg p-2">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-white truncate">{file.name}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">({formatFileSize(file.size)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSelectedFile(index)}
                        className="ml-2 text-red-400 hover:text-red-300 flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Display Existing Attachments */}
            {existingAttachments.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Uploaded files ({existingAttachments.length}):</p>
                <div className="space-y-2">
                  {existingAttachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-2">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-white truncate">{attachment.name}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">({formatFileSize(attachment.size)})</span>
                      </div>
                      <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingAttachment(attachment)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Client Notes */}
          <div>
            <label htmlFor="client_notes" className="block text-sm font-medium text-gray-300 mb-2">
              Client Notes
            </label>
            <textarea
              id="client_notes"
              value={currentClientNote}
              onChange={(e) => setCurrentClientNote(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white placeholder-gray-400"
              placeholder="Clients can add feedback and additional context about the bug here"
              rows={5}
            />
            
            {/* Previous Client Notes */}
            {previousClientNotes.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-medium text-gray-400 mb-2">Previous Notes</div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(() => {
                    // Sort oldest to newest for numbering
                    const sortedAsc = [...previousClientNotes].sort((a, b) => 
                      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                    )
                    // Reverse for display (newest first)
                    const sortedDesc = [...sortedAsc].reverse()
                    return sortedDesc.map((noteItem, displayIndex) => {
                      const noteIndex = sortedAsc.findIndex(n => n.timestamp === noteItem.timestamp)
                      const noteNumber = noteIndex + 1
                      return (
                        <div key={displayIndex} className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-2">
                          <div className="text-xs text-gray-400 mb-1">
                            Note {noteNumber} - {formatNoteDate(noteItem.timestamp)}
                          </div>
                          <div className="text-sm text-white whitespace-pre-wrap">{noteItem.note}</div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Developer Notes */}
          <div>
            <label htmlFor="developer_notes" className="block text-sm font-medium text-gray-300 mb-2">
              Developer Notes
            </label>
            <textarea
              id="developer_notes"
              value={currentDeveloperNote}
              onChange={(e) => setCurrentDeveloperNote(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white placeholder-gray-400"
              placeholder="Developers will provide clarity and updates about the bug here"
              rows={5}
            />
            
            {/* Previous Developer Notes */}
            {previousDeveloperNotes.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-medium text-gray-400 mb-2">Previous Notes</div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(() => {
                    // Sort oldest to newest for numbering
                    const sortedAsc = [...previousDeveloperNotes].sort((a, b) => 
                      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                    )
                    // Reverse for display (newest first)
                    const sortedDesc = [...sortedAsc].reverse()
                    return sortedDesc.map((noteItem, displayIndex) => {
                      const noteIndex = sortedAsc.findIndex(n => n.timestamp === noteItem.timestamp)
                      const noteNumber = noteIndex + 1
                      return (
                        <div key={displayIndex} className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-2">
                          <div className="text-xs text-gray-400 mb-1">
                            Note {noteNumber} - {formatNoteDate(noteItem.timestamp)}
                          </div>
                          <div className="text-sm text-white whitespace-pre-wrap">{noteItem.note}</div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Status History - Only show when editing */}
          {bug && statusHistory.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-400 mb-2">Status history:</div>
              <div className="space-y-1">
                {[...statusHistory]
                  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                  .map((statusItem, index) => (
                    <div key={index} className="text-sm text-gray-300">
                      {statusItem.status} - {formatStatusHistoryDate(statusItem.timestamp)}
                    </div>
                  ))}
              </div>
            </div>
          )}
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
              disabled={uploadingFiles}
              className="px-4 py-2 bg-[#1e316d] hover:bg-[#2a4494] text-white rounded-lg font-medium transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingFiles ? 'Uploading...' : (bug ? 'Update Bug' : 'Create Bug')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}