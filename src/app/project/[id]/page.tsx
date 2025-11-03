'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'
import { use } from 'react'
import BugForm from '@/components/BugForm'

type Project = Database['public']['Tables']['projects']['Row']
type Bug = Database['public']['Tables']['bugs']['Row']

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [project, setProject] = useState<Project | null>(null)
  const [bugs, setBugs] = useState<Bug[]>([])
  const [showBugForm, setShowBugForm] = useState(false)
  const [editingBug, setEditingBug] = useState<Bug | null>(null)
  const [viewingBug, setViewingBug] = useState<Bug | null>(null)
  const [loading, setLoading] = useState(true)
  const [projectDetails, setProjectDetails] = useState('')
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [filterPortal, setFilterPortal] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterAssignedTo, setFilterAssignedTo] = useState<string>('all')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showEditDropdowns, setShowEditDropdowns] = useState(false)

  // Default dropdown options
  const DEFAULT_PORTAL_OPTIONS = ['Admin Panel', 'Customer Side']
  const DEFAULT_PRIORITY_OPTIONS = ['Minor', 'Medium', 'Major', 'Critical']
  const DEFAULT_STATUS_OPTIONS = ['Open', 'In Progress', 'Ready for QA', 'Closed', 'Reopened', 'Not a Bug', 'Needs Clarification', 'Out of Scope']
  const DEFAULT_ASSIGNED_TO_OPTIONS = ['Developer', 'Frontend', 'Backend']

  // Custom options from localStorage
  const [customPortalOptions, setCustomPortalOptions] = useState<string[]>([])
  const [customPriorityOptions, setCustomPriorityOptions] = useState<string[]>([])
  const [customStatusOptions, setCustomStatusOptions] = useState<string[]>([])
  const [customAssignedToOptions, setCustomAssignedToOptions] = useState<string[]>([])


  useEffect(() => {
    fetchProject()
    fetchBugs()
    
    // Load custom options from localStorage
    if (typeof window !== 'undefined') {
      const portalKey = `custom_portal_options_${resolvedParams.id}`
      const priorityKey = `custom_priority_options_${resolvedParams.id}`
      const statusKey = `custom_status_options_${resolvedParams.id}`

      const assignedToKey = `custom_assigned_to_options_${resolvedParams.id}`
      const storedPortals = localStorage.getItem(portalKey)
      const storedPriorities = localStorage.getItem(priorityKey)
      const storedStatuses = localStorage.getItem(statusKey)
      const storedAssignedTo = localStorage.getItem(assignedToKey)

      setCustomPortalOptions(storedPortals ? JSON.parse(storedPortals) : [])
      setCustomPriorityOptions(storedPriorities ? JSON.parse(storedPriorities) : [])
      setCustomStatusOptions(storedStatuses ? JSON.parse(storedStatuses) : [])
      setCustomAssignedToOptions(storedAssignedTo ? JSON.parse(storedAssignedTo) : [])

      // Prevent navigation back to main dashboard
      // Replace the current history entry to remove the referrer
      if (window.history.length > 1 && document.referrer.includes(window.location.origin)) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }

      // Prevent back button navigation
      const preventBack = () => {
        window.history.pushState(null, '', window.location.pathname + window.location.search)
      }

      window.addEventListener('popstate', preventBack)

      return () => {
        window.removeEventListener('popstate', preventBack)
      }
    }
  }, [resolvedParams.id])

  // Update page title when project is loaded
  useEffect(() => {
    if (project) {
      document.title = `${project.name} - Tracepoint`
    }
  }, [project])

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()

      if (error) throw error
      setProject(data)
      setProjectDetails(data.project_details || '')
      setEditedName(data.name || '')
      setEditedDescription(data.description || '')
    } catch (error) {
      console.error('Error fetching project:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBugs = async () => {
    try {
      const { data, error } = await supabase
        .from('bugs')
        .select('*')
        .eq('project_id', resolvedParams.id)
        .order('date_added', { ascending: false })

      if (error) throw error
      setBugs(data || [])
    } catch (error) {
      console.error('Error fetching bugs:', error)
    }
  }

  const handleSaveProjectDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({ 
          name: editedName,
          description: editedDescription,
          project_details: projectDetails 
        })
        .eq('id', resolvedParams.id)
        .select()
        .single()

      if (error) throw error
      setProject(data)
      setIsEditingDetails(false)
    } catch (error) {
      console.error('Error saving project details:', error)
    }
  }

  const handleCreateBug = async (bugData: Omit<Bug, 'id' | 'created_at' | 'updated_at' | 'date_added'>) => {
    try {
      console.log('Creating bug with data:', bugData)
      const { data, error} = await supabase
        .from('bugs')
        .insert([bugData])
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        alert(`Error creating bug: ${error.message}`)
        throw error
      }
      
      console.log('Bug created successfully:', data)
      setBugs([data, ...bugs])
      setShowBugForm(false)
      fetchBugs() // Refresh bugs list
    } catch (error) {
      console.error('Error creating bug:', error)
    }
  }

  const handleUpdateBug = async (id: string, bugData: Partial<Bug>) => {
    try {
      const { data, error } = await supabase
        .from('bugs')
        .update(bugData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setBugs(bugs.map(bug => bug.id === id ? data : bug))
      setEditingBug(null)
    } catch (error) {
      console.error('Error updating bug:', error)
    }
  }

  const handleDeleteBug = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bug?')) return

    try {
      const { error } = await supabase
        .from('bugs')
        .delete()
        .eq('id', id)

      if (error) throw error
      setBugs(bugs.filter(bug => bug.id !== id))
    } catch (error) {
      console.error('Error deleting bug:', error)
    }
  }

  const handleCopyLink = async () => {
    try {
      const projectUrl = `${window.location.origin}/project/${resolvedParams.id}`
      await navigator.clipboard.writeText(projectUrl)
      setCopyLinkSuccess(true)
      setTimeout(() => setCopyLinkSuccess(false), 2000)
    } catch (error) {
      console.error('Error copying link:', error)
      alert('Failed to copy link to clipboard')
    }
  }

  // Filter bugs based on selected filters
  const filteredBugs = bugs.filter(bug => {
    const portalMatch = filterPortal === 'all' || bug.portal === filterPortal
    const statusMatch = filterStatus === 'all' || bug.status === filterStatus
    const priorityMatch = filterPriority === 'all' || bug.priority === filterPriority
    const assignedToMatch = filterAssignedTo === 'all' || bug.assigned_to === filterAssignedTo
    return portalMatch && statusMatch && priorityMatch && assignedToMatch
  })

  // Get all available filter options (default + custom)
  const allPortalOptions = [...DEFAULT_PORTAL_OPTIONS, ...customPortalOptions]
  const allStatusOptions = [...DEFAULT_STATUS_OPTIONS, ...customStatusOptions]
  const allPriorityOptions = [...DEFAULT_PRIORITY_OPTIONS, ...customPriorityOptions]
  
  // Get unique assigned to values from bugs + default + custom
  const bugAssignedToOptions = Array.from(new Set(bugs.map(bug => bug.assigned_to).filter(Boolean)))
  const allAssignedToOptions = Array.from(new Set([...DEFAULT_ASSIGNED_TO_OPTIONS, ...customAssignedToOptions, ...bugAssignedToOptions])).sort()

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-600 text-white'
      case 'major': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'minor': return 'bg-green-100 text-green-800'
      default: return 'bg-white text-black' // Custom priorities: white fill, black text
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'in progress': return 'bg-purple-100 text-purple-800'
      case 'ready for qa': return 'bg-blue-100 text-blue-800'
      case 'closed': return 'bg-green-500 text-white'
      case 'reopened': return 'bg-red-600 text-white'
      case 'not a bug': return 'bg-gray-300 text-black'
      case 'needs clarification': return 'bg-yellow-100 text-yellow-800'
      case 'out of scope': return 'bg-black text-white'
      default: return 'bg-white text-black' // Custom statuses: white fill, black text
    }
  }

  const getPortalColor = (portal: string) => {
    switch (portal.toLowerCase()) {
      case 'admin panel': return 'bg-blue-100 text-blue-800'
      case 'customer side': return 'bg-green-100 text-green-800'
      default: return 'bg-white text-black' // Custom portals: white fill, black text
    }
  }

  const getAssignedToColor = (assignedTo: string) => {
    switch (assignedTo.toLowerCase()) {
      case 'frontend': return 'bg-blue-100 text-blue-800'
      case 'backend': return 'bg-purple-100 text-purple-800'
      case 'developer': return 'bg-green-100 text-green-800'
      default: return 'bg-white text-black' // Custom assigned to: white fill, black text
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2) // Last 2 digits of year
    return `${day}/${month}/${year}`
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

  // Helper function to get file type based on name/type
  const getFileType = (attachment: { name: string; url: string; size: number; type: string }): 'image' | 'video' | 'pdf' | 'file' => {
    const name = attachment.name.toLowerCase()
    const type = attachment.type?.toLowerCase() || ''
    
    // Check by MIME type first
    if (type.includes('image/')) return 'image'
    if (type.includes('video/')) return 'video'
    if (type.includes('pdf') || type === 'application/pdf') return 'pdf'
    
    // Check by file extension
    if (name.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/)) return 'image'
    if (name.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/)) return 'video'
    if (name.match(/\.(pdf)$/)) return 'pdf'
    
    return 'file'
  }

  // Icon component for file types
  const FileTypeIcon = ({ type, url, name }: { type: 'image' | 'video' | 'pdf' | 'file', url: string, name: string }) => {
    const iconClasses = "w-5 h-5 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
    
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      window.open(url, '_blank', 'noopener,noreferrer')
    }
    
    switch (type) {
      case 'image':
        return (
          <svg 
            className={iconClasses} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            onClick={handleClick}
          >
            <title>{name}</title>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      case 'video':
        return (
          <svg 
            className={iconClasses} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            onClick={handleClick}
          >
            <title>{name}</title>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )
      case 'pdf':
        return (
          <svg 
            className={iconClasses} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            onClick={handleClick}
          >
            <title>{name}</title>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )
      default:
        return (
          <svg 
            className={iconClasses} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            onClick={handleClick}
          >
            <title>{name}</title>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-xl text-white">Loading...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-xl text-red-500">Project not found</div>
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
      <div className="relative z-10">
        <div className="backdrop-blur-md bg-white/5 border-b border-white/10 shadow-lg">
          <div className="max-w-[98%] mx-auto px-2 sm:px-4 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-3 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <img 
                  src="/logo.png" 
                  alt="Tracepoint Logo" 
                  className="w-10 h-10 sm:w-16 sm:h-16 lg:w-20 lg:h-20"
                />
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{project.name}</h1>
                  {project.description && (
                    <p className="text-xs sm:text-sm text-gray-300 mt-1">{project.description}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center w-full sm:w-auto gap-2">
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all shadow-lg text-sm sm:text-base ${
                    copyLinkSuccess 
                      ? 'bg-green-600 text-white' 
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  {copyLinkSuccess ? (
                    <>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

      <div className="max-w-[98%] mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Two Column Layout: Project Details + Current Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Project Details Section */}
          <div className="backdrop-blur-md bg-white/10 rounded-lg shadow-xl border border-white/20 p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-white">Project Details</h2>
              {!isEditingDetails ? (
                <button
                  onClick={() => {
                    if (!projectDetails) {
                      setProjectDetails('URL: \nUsername: \nPassword: ')
                    }
                    setEditedName(project?.name || '')
                    setEditedDescription(project?.description || '')
                    setIsEditingDetails(true)
                  }}
                  className="text-xs sm:text-sm text-[#1e316d] bg-white/90 hover:bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded font-medium transition-colors"
                >
                  Edit
                </button>
              ) : (
                <div className="space-x-2">
                  <button
                    onClick={handleSaveProjectDetails}
                    className="bg-[#1e316d] hover:bg-[#2a4494] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors shadow-lg text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setProjectDetails(project.project_details || '')
                      setEditedName(project.name || '')
                      setEditedDescription(project.description || '')
                      setIsEditingDetails(false)
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {isEditingDetails ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white placeholder-gray-400"
                    placeholder="Enter project name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white placeholder-gray-400"
                    placeholder="Enter project description"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Additional Details
                  </label>
                  <textarea
                    value={projectDetails}
                    onChange={(e) => setProjectDetails(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white placeholder-gray-400 min-h-[150px] text-sm"
                    placeholder="URL: &#10;Username: &#10;Password: "
                  />
                </div>
              </div>
            ) : (
              <div className="text-gray-300 whitespace-pre-wrap text-sm min-h-[60px] sm:min-h-[100px] max-h-[72px] sm:max-h-none overflow-hidden sm:overflow-visible relative">
                {projectDetails || 'No project details added yet. Click Edit to add details.'}
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white/10 to-transparent sm:hidden pointer-events-none"></div>
              </div>
            )}
          </div>

          {/* Current Status Section */}
          <div className="backdrop-blur-md bg-white/10 rounded-lg shadow-xl border border-white/20 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Current Status</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-white/20">
                <span className="text-xs sm:text-sm md:text-base text-gray-300 font-medium">Total Bugs:</span>
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-white">{bugs.length}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-white/20">
                <span className="text-xs sm:text-sm md:text-base text-gray-300 font-medium">Open Bugs:</span>
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-red-400">
                  {bugs.filter(bug => bug.status.toLowerCase() === 'open' || bug.status.toLowerCase() === 'reopened').length}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-white/20">
                <span className="text-xs sm:text-sm md:text-base text-gray-300 font-medium">Closed Bugs:</span>
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-green-400">
                  {bugs.filter(bug => bug.status.toLowerCase() === 'closed').length}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-white/20 sm:border-b-0">
                <span className="text-xs sm:text-sm md:text-base text-gray-300 font-medium">Out of Scope:</span>
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-400">
                  {bugs.filter(bug => bug.status.toLowerCase() === 'out of scope').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bug Forms */}
        {showBugForm && (
          <BugForm
            projectId={resolvedParams.id}
            onSubmit={handleCreateBug}
            onCancel={() => setShowBugForm(false)}
          />
        )}

        {editingBug && (
          <BugForm
            projectId={resolvedParams.id}
            bug={editingBug}
            onSubmit={(bugData) => handleUpdateBug(editingBug.id, bugData)}
            onCancel={() => setEditingBug(null)}
          />
        )}

        {/* Action Buttons Above Table */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
          {/* Add Bug Button */}
          <button
            onClick={() => setShowBugForm(true)}
            className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors shadow-lg text-sm sm:text-base flex items-center justify-center gap-2"
          >
            <span>+</span>
            <span>Add Bug</span>
          </button>

          {/* Edit Dropdowns Button */}
          <button
            onClick={() => {
              setShowEditDropdowns(!showEditDropdowns)
              setShowFilterDropdown(false)
            }}
            className="flex-1 sm:flex-none bg-gray-700 hover:bg-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors shadow-lg text-sm sm:text-base flex items-center justify-center gap-2"
          >
            <span>Edit Dropdowns</span>
            {showEditDropdowns ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>

          {/* Filter View Button */}
          <button
            onClick={() => {
              setShowFilterDropdown(!showFilterDropdown)
              setShowEditDropdowns(false)
            }}
            className="flex-1 sm:flex-none bg-gray-700 hover:bg-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors shadow-lg text-sm sm:text-base flex items-center justify-center gap-2"
          >
            <span>Filter View</span>
            {showFilterDropdown ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        </div>

        {/* Filter View Dropdown - Expands Below */}
        {showFilterDropdown && (
          <div className="backdrop-blur-md bg-white/10 rounded-lg shadow-xl border border-white/20 p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Filter Bugs</h3>
              {(filterPortal !== 'all' || filterStatus !== 'all' || filterPriority !== 'all' || filterAssignedTo !== 'all') && (
                <button
                  onClick={() => {
                    setFilterPortal('all')
                    setFilterStatus('all')
                    setFilterPriority('all')
                    setFilterAssignedTo('all')
                  }}
                      className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                >
                      Clear
                </button>
              )}
            </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Portal Filter */}
              <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Portal</label>
                <select
                  value={filterPortal}
                  onChange={(e) => setFilterPortal(e.target.value)}
                      className="w-full px-2 sm:px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white cursor-pointer text-xs sm:text-sm"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="all" className="bg-gray-900 text-white">All</option>
                  {allPortalOptions.map(portal => (
                        <option key={portal} value={portal} className="bg-gray-900 text-white">
                      {portal}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-2 sm:px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white cursor-pointer text-xs sm:text-sm"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="all" className="bg-gray-900 text-white">All</option>
                  {allStatusOptions.map(status => (
                        <option key={status} value={status} className="bg-gray-900 text-white">
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Priority</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                      className="w-full px-2 sm:px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white cursor-pointer text-xs sm:text-sm"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="all" className="bg-gray-900 text-white">All</option>
                  {allPriorityOptions.map(priority => (
                        <option key={priority} value={priority} className="bg-gray-900 text-white">
                      {priority}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assigned To Filter */}
              <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Assigned To</label>
                <select
                  value={filterAssignedTo}
                  onChange={(e) => setFilterAssignedTo(e.target.value)}
                      className="w-full px-2 sm:px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white cursor-pointer text-xs sm:text-sm"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="all" className="bg-gray-900 text-white">All</option>
                  {allAssignedToOptions.map(assignedTo => (
                        <option key={assignedTo} value={assignedTo} className="bg-gray-900 text-white">
                      {assignedTo}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {(filterPortal !== 'all' || filterStatus !== 'all' || filterPriority !== 'all' || filterAssignedTo !== 'all') && (
                  <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-400">
                Showing {filteredBugs.length} of {bugs.length} bugs
              </div>
            )}
          </div>
        )}

        {/* Edit Dropdowns Section - Expands Below */}
        {showEditDropdowns && (
          <div className="backdrop-blur-md bg-white/10 rounded-lg shadow-xl border border-white/20 p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Edit Custom Dropdown Options</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Portal Options */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Portal:</h4>
                <div className="space-y-1 mb-3">
                  {DEFAULT_PORTAL_OPTIONS.map((option) => (
                    <div key={option} className="px-3 py-2 bg-white/5 border border-white/10 rounded text-gray-300 text-sm">
                      {option}
                    </div>
                  ))}
                  {customPortalOptions.map((option) => (
                    <div key={option} className="flex justify-between items-center px-3 py-2 bg-blue-900/30 border border-blue-500/30 rounded text-white text-sm">
                      <span>{option}</span>
                      <button
                        onClick={() => {
                          const newOptions = customPortalOptions.filter(o => o !== option)
                          setCustomPortalOptions(newOptions)
                          localStorage.setItem(`custom_portal_options_${resolvedParams.id}`, JSON.stringify(newOptions))
                        }}
                        className="text-red-400 hover:text-red-300 font-medium text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add new portal option"
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white placeholder-gray-400 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const value = e.currentTarget.value.trim()
                        if (value && !DEFAULT_PORTAL_OPTIONS.includes(value) && !customPortalOptions.includes(value)) {
                          const newOptions = [...customPortalOptions, value]
                          setCustomPortalOptions(newOptions)
                          localStorage.setItem(`custom_portal_options_${resolvedParams.id}`, JSON.stringify(newOptions))
                          e.currentTarget.value = ''
                        }
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement
                      const value = input.value.trim()
                      if (value && !DEFAULT_PORTAL_OPTIONS.includes(value) && !customPortalOptions.includes(value)) {
                        const newOptions = [...customPortalOptions, value]
                        setCustomPortalOptions(newOptions)
                        localStorage.setItem(`custom_portal_options_${resolvedParams.id}`, JSON.stringify(newOptions))
                        input.value = ''
                      }
                    }}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Priority Options */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Priority:</h4>
                <div className="space-y-1 mb-3">
                  {DEFAULT_PRIORITY_OPTIONS.map((option) => (
                    <div key={option} className="px-3 py-2 bg-white/5 border border-white/10 rounded text-gray-300 text-sm">
                      {option}
                    </div>
                  ))}
                  {customPriorityOptions.map((option) => (
                    <div key={option} className="flex justify-between items-center px-3 py-2 bg-blue-900/30 border border-blue-500/30 rounded text-white text-sm">
                      <span>{option}</span>
                      <button
                        onClick={() => {
                          const newOptions = customPriorityOptions.filter(o => o !== option)
                          setCustomPriorityOptions(newOptions)
                          localStorage.setItem(`custom_priority_options_${resolvedParams.id}`, JSON.stringify(newOptions))
                        }}
                        className="text-red-400 hover:text-red-300 font-medium text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add new priority option"
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white placeholder-gray-400 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const value = e.currentTarget.value.trim()
                        if (value && !DEFAULT_PRIORITY_OPTIONS.includes(value) && !customPriorityOptions.includes(value)) {
                          const newOptions = [...customPriorityOptions, value]
                          setCustomPriorityOptions(newOptions)
                          localStorage.setItem(`custom_priority_options_${resolvedParams.id}`, JSON.stringify(newOptions))
                          e.currentTarget.value = ''
                        }
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement
                      const value = input.value.trim()
                      if (value && !DEFAULT_PRIORITY_OPTIONS.includes(value) && !customPriorityOptions.includes(value)) {
                        const newOptions = [...customPriorityOptions, value]
                        setCustomPriorityOptions(newOptions)
                        localStorage.setItem(`custom_priority_options_${resolvedParams.id}`, JSON.stringify(newOptions))
                        input.value = ''
                      }
                    }}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Status Options */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Status:</h4>
                <div className="space-y-1 mb-3">
                  {DEFAULT_STATUS_OPTIONS.map((option) => (
                    <div key={option} className="px-3 py-2 bg-white/5 border border-white/10 rounded text-gray-300 text-sm">
                      {option}
                    </div>
                  ))}
                  {customStatusOptions.map((option) => (
                    <div key={option} className="flex justify-between items-center px-3 py-2 bg-blue-900/30 border border-blue-500/30 rounded text-white text-sm">
                      <span>{option}</span>
                      <button
                        onClick={() => {
                          const newOptions = customStatusOptions.filter(o => o !== option)
                          setCustomStatusOptions(newOptions)
                          localStorage.setItem(`custom_status_options_${resolvedParams.id}`, JSON.stringify(newOptions))
                        }}
                        className="text-red-400 hover:text-red-300 font-medium text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add new status option"
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white placeholder-gray-400 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const value = e.currentTarget.value.trim()
                        if (value && !DEFAULT_STATUS_OPTIONS.includes(value) && !customStatusOptions.includes(value)) {
                          const newOptions = [...customStatusOptions, value]
                          setCustomStatusOptions(newOptions)
                          localStorage.setItem(`custom_status_options_${resolvedParams.id}`, JSON.stringify(newOptions))
                          e.currentTarget.value = ''
                        }
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement
                      const value = input.value.trim()
                      if (value && !DEFAULT_STATUS_OPTIONS.includes(value) && !customStatusOptions.includes(value)) {
                        const newOptions = [...customStatusOptions, value]
                        setCustomStatusOptions(newOptions)
                        localStorage.setItem(`custom_status_options_${resolvedParams.id}`, JSON.stringify(newOptions))
                        input.value = ''
                      }
                    }}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Assigned To Options */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Assigned To:</h4>
                <div className="space-y-1 mb-3">
                  {DEFAULT_ASSIGNED_TO_OPTIONS.map((option) => (
                    <div key={option} className="px-3 py-2 bg-white/5 border border-white/10 rounded text-gray-300 text-sm">
                      {option}
                    </div>
                  ))}
                  {customAssignedToOptions.map((option) => (
                    <div key={option} className="flex justify-between items-center px-3 py-2 bg-blue-900/30 border border-blue-500/30 rounded text-white text-sm">
                      <span>{option}</span>
                      <button
                        onClick={() => {
                          const newOptions = customAssignedToOptions.filter(o => o !== option)
                          setCustomAssignedToOptions(newOptions)
                          localStorage.setItem(`custom_assigned_to_options_${resolvedParams.id}`, JSON.stringify(newOptions))
                        }}
                        className="text-red-400 hover:text-red-300 font-medium text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add new assigned to option"
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white placeholder-gray-400 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const value = e.currentTarget.value.trim()
                        if (value && !DEFAULT_ASSIGNED_TO_OPTIONS.includes(value) && !customAssignedToOptions.includes(value)) {
                          const newOptions = [...customAssignedToOptions, value]
                          setCustomAssignedToOptions(newOptions)
                          localStorage.setItem(`custom_assigned_to_options_${resolvedParams.id}`, JSON.stringify(newOptions))
                          e.currentTarget.value = ''
                        }
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement
                      const value = input.value.trim()
                      if (value && !DEFAULT_ASSIGNED_TO_OPTIONS.includes(value) && !customAssignedToOptions.includes(value)) {
                        const newOptions = [...customAssignedToOptions, value]
                        setCustomAssignedToOptions(newOptions)
                        localStorage.setItem(`custom_assigned_to_options_${resolvedParams.id}`, JSON.stringify(newOptions))
                        input.value = ''
                      }
                    }}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bug Display - Table View (All Screen Sizes) */}
        {bugs.length === 0 ? (
          <div className="text-center py-12 backdrop-blur-md bg-white/10 rounded-lg shadow-xl border border-white/20">
            <div className="text-gray-300 text-base sm:text-lg mb-4">No bugs reported yet</div>
            <button
              onClick={() => setShowBugForm(true)}
              className="bg-[#1e316d] hover:bg-[#2a4494] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors shadow-lg text-sm sm:text-base"
            >
              Report First Bug
            </button>
          </div>
        ) : (
          <div className="backdrop-blur-md bg-white/10 rounded-lg shadow-xl border border-white/20 overflow-x-auto">
            <div className="overflow-y-auto overflow-x-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
              <table className="w-full divide-y divide-white/20 min-w-full">
                <thead className="bg-black sticky top-0 z-10 shadow-md border-b border-white/20">
                <tr>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap min-w-[80px]">
                    Bug ID
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap min-w-[90px]">
                    Portal
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap min-w-[80px]">
                    Priority
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                    Bug Title
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap min-w-[250px]">
                    Bug Description
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                    Status
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap min-w-[90px]">
                    Assigned To
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap w-[70px]">
                    Reference
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap min-w-[200px]">
                    Client Notes
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap min-w-[200px]">
                    Developer Notes
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap min-w-[90px]">
                    Date Added
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-white/10">
                {filteredBugs.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-2 sm:px-3 py-8 text-center">
                      <div className="text-gray-400 text-lg mb-2">No bugs match the selected filters</div>
                      <button
                        onClick={() => {
                          setFilterPortal('all')
                          setFilterStatus('all')
                          setFilterPriority('all')
                          setFilterAssignedTo('all')
                        }}
                        className="text-[#1e316d] bg-white/90 hover:bg-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                      >
                        Clear Filters
                      </button>
                    </td>
                  </tr>
                ) : filteredBugs.map((bug) => (
                  <tr 
                    key={bug.id} 
                    className="hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => setViewingBug(bug)}
                  >
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white whitespace-nowrap">
                      <div className="break-words">{bug.bug_id}</div>
                    </td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-center">
                      <span className={`inline-flex items-center justify-center text-center px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold rounded-full whitespace-normal break-words max-w-[100px] ${getPortalColor(bug.portal)}`}>
                        {bug.portal}
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-center">
                      <span className={`inline-flex items-center justify-center text-center px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold rounded-full whitespace-normal break-words max-w-[100px] ${getPriorityColor(bug.priority)}`}>
                        {bug.priority}
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm text-white">
                      <div className="break-words line-clamp-2 max-w-[120px]">
                        {bug.module_feature || '-'}
                      </div>
                    </td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm text-gray-300">
                      <div className="break-words line-clamp-3 max-w-[250px]">
                        {bug.bug_description || '-'}
                      </div>
                    </td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-center">
                      <span className={`inline-flex items-center justify-center text-center px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold rounded-full whitespace-normal break-words max-w-[120px] ${getStatusColor(bug.status)}`}>
                        {bug.status}
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-center">
                      <span className={`inline-flex items-center justify-center text-center px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold rounded-full whitespace-normal break-words max-w-[100px] ${getAssignedToColor(bug.assigned_to)}`}>
                        {bug.assigned_to}
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm text-gray-300">
                      {bug.attachments && bug.attachments.length > 0 ? (
                        <div className="flex flex-row gap-1 items-center justify-start">
                          {bug.attachments
                            .slice()
                            .reverse()
                            .slice(0, 2)
                            .map((attachment, idx) => (
                              <FileTypeIcon
                                key={idx}
                                type={getFileType(attachment)}
                                url={attachment.url}
                                name={attachment.name}
                              />
                            ))}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm text-gray-300">
                      {bug.client_notes && Array.isArray(bug.client_notes) && bug.client_notes.length > 0 ? (
                        (() => {
                          const sortedNotes = [...bug.client_notes].sort((a, b) => 
                            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                          )
                          const latestNote = sortedNotes[0]
                          return (
                            <div className="break-words line-clamp-3 max-w-[200px]" title={latestNote.note}>
                              {latestNote.note}
                      </div>
                          )
                        })()
                      ) : bug.client_notes && typeof bug.client_notes === 'string' ? (
                        <div className="break-words line-clamp-3 max-w-[200px]">{bug.client_notes}</div>
                      ) : '-'}
                    </td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm text-gray-300">
                      {bug.developer_notes && Array.isArray(bug.developer_notes) && bug.developer_notes.length > 0 ? (
                        (() => {
                          const sortedNotes = [...bug.developer_notes].sort((a, b) => 
                            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                          )
                          const latestNote = sortedNotes[0]
                          return (
                            <div className="break-words line-clamp-3 max-w-[200px]" title={latestNote.note}>
                              {latestNote.note}
                      </div>
                          )
                        })()
                      ) : bug.developer_notes && typeof bug.developer_notes === 'string' ? (
                        <div className="break-words line-clamp-3 max-w-[200px]">{bug.developer_notes}</div>
                      ) : '-'}
                    </td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm text-gray-300 whitespace-nowrap">
                      <div className="break-words">{formatDate(bug.date_added)}</div>
                    </td>
                    <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingBug(bug)
                          }}
                          className="text-blue-400 hover:text-blue-300 text-left text-xs sm:text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteBug(bug.id)
                          }}
                          className="text-red-400 hover:text-red-300 text-left text-xs sm:text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* Bug Details Popup */}
        {viewingBug && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="backdrop-blur-md bg-white/10 rounded-lg shadow-xl border border-white/20 max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-start p-4 sm:p-6 border-b border-white/20 flex-shrink-0">
                <h2 className="text-xl sm:text-2xl font-semibold text-white">Bug Details</h2>
                  <button
                    onClick={() => setViewingBug(null)}
                  className="text-gray-400 hover:text-white text-xl sm:text-2xl leading-none"
                  >
                    ×
                  </button>
              </div>

              <div className="space-y-4 p-4 sm:p-6 overflow-y-auto flex-grow">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Bug ID</label>
                    <div className="text-white font-semibold text-base sm:text-lg">{viewingBug.bug_id}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Portal</label>
                    <span className={`inline-flex items-center justify-center text-center px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-full whitespace-normal ${getPortalColor(viewingBug.portal)}`}>
                      {viewingBug.portal}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                    <span className={`inline-flex items-center justify-center text-center px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-full whitespace-normal ${getPriorityColor(viewingBug.priority)}`}>
                      {viewingBug.priority}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                    <span className={`inline-flex items-center justify-center text-center px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-full whitespace-normal ${getStatusColor(viewingBug.status)}`}>
                      {viewingBug.status}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Assigned To</label>
                    <span className={`inline-flex items-center justify-center text-center px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-full whitespace-normal ${getAssignedToColor(viewingBug.assigned_to)}`}>
                      {viewingBug.assigned_to}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Date Added</label>
                    <div className="text-white">{formatDate(viewingBug.date_added)}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Bug Title</label>
                  <div className="text-white bg-white/5 p-3 rounded border border-white/20 text-sm sm:text-base">
                    {viewingBug.module_feature || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Bug Description</label>
                  <div className="text-white bg-white/5 p-3 rounded border border-white/20 whitespace-pre-wrap text-sm sm:text-base">
                    {viewingBug.bug_description || '-'}
                  </div>
                </div>

                {viewingBug.attachments && viewingBug.attachments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Attachments ({viewingBug.attachments.length})</label>
                    <div className="space-y-2">
                      {viewingBug.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between bg-white/5 border border-white/20 rounded-lg p-3">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-sm sm:text-base truncate">{attachment.name}</div>
                              <div className="text-gray-400 text-xs">
                                {(attachment.size / 1024).toFixed(2)} KB
                              </div>
                            </div>
                          </div>
                          <a
                            href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                            className="ml-3 flex-shrink-0 bg-[#1e316d] hover:bg-[#2a4494] text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                            onClick={(e) => e.stopPropagation()}
                    >
                            View
                    </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {viewingBug.client_notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Client Notes
                    </label>
                    {Array.isArray(viewingBug.client_notes) && viewingBug.client_notes.length > 0 ? (
                      <>
                        {(() => {
                          // Sort oldest to newest for numbering (oldest = Note 1)
                          const sortedAsc = [...viewingBug.client_notes].sort((a, b) => 
                            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                          )
                          // Reverse for display (latest first)
                          const sortedDesc = [...sortedAsc].reverse()
                          const latestNote = sortedDesc[0]
                          const previousNotes = sortedDesc.slice(1)
                          const totalNotes = sortedAsc.length
                          
                          return (
                            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-2">
                              <div className="text-xs text-gray-400 mb-1">
                                Note {totalNotes} - {formatNoteDate(latestNote.timestamp)}
                    </div>
                              <div className="text-white whitespace-pre-wrap text-sm sm:text-base">
                                {latestNote.note}
                              </div>
                            </div>
                          )
                        })()}
                      </>
                    ) : (
                      <div className="text-white bg-purple-900/30 p-3 rounded border border-purple-500/30 whitespace-pre-wrap text-sm sm:text-base">
                        {typeof viewingBug.client_notes === 'string' ? viewingBug.client_notes : '-'}
                      </div>
                    )}
                  </div>
                )}

                {viewingBug.developer_notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Developer Notes
                    </label>
                    {Array.isArray(viewingBug.developer_notes) && viewingBug.developer_notes.length > 0 ? (
                      <>
                        {(() => {
                          // Sort oldest to newest for numbering (oldest = Note 1)
                          const sortedAsc = [...viewingBug.developer_notes].sort((a, b) => 
                            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                          )
                          // Reverse for display (latest first)
                          const sortedDesc = [...sortedAsc].reverse()
                          const latestNote = sortedDesc[0]
                          const previousNotes = sortedDesc.slice(1)
                          const totalNotes = sortedAsc.length
                          
                          return (
                            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-2">
                              <div className="text-xs text-gray-400 mb-1">
                                Note {totalNotes} - {formatNoteDate(latestNote.timestamp)}
                    </div>
                              <div className="text-white whitespace-pre-wrap text-sm sm:text-base">
                                {latestNote.note}
                              </div>
                            </div>
                          )
                        })()}
                      </>
                    ) : (
                      <div className="text-white bg-yellow-900/30 p-3 rounded border border-yellow-500/30 whitespace-pre-wrap text-sm sm:text-base">
                        {typeof viewingBug.developer_notes === 'string' ? viewingBug.developer_notes : '-'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 p-4 sm:p-6 border-t border-white/20 flex-shrink-0">
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this bug?')) {
                      handleDeleteBug(viewingBug.id)
                      setViewingBug(null)
                    }
                  }}
                  className="px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white border border-red-500/30 rounded-lg font-medium transition-colors text-sm sm:text-base"
                >
                  Delete Bug
                </button>
                <button
                  onClick={() => {
                    setViewingBug(null)
                    setEditingBug(viewingBug)
                  }}
                  className="px-3 sm:px-4 py-2 bg-[#1e316d] hover:bg-[#2a4494] text-white border border-[#1e316d]/30 rounded-lg font-medium transition-colors text-sm sm:text-base"
                >
                  Edit Bug
                </button>
                <button
                  onClick={() => setViewingBug(null)}
                  className="px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg font-medium transition-colors text-sm sm:text-base"
                >
                  Close Bug
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
