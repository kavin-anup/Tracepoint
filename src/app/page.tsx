'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'
import ProjectForm from '@/components/ProjectForm'
import Link from 'next/link'

type Project = Database['public']['Tables']['projects']['Row']

interface ProjectWithBugCount extends Project {
  bugCount?: number
}

export default function Home() {
  const [projects, setProjects] = useState<ProjectWithBugCount[]>([])
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  // Color palette for project cards
  const cardColors = [
    '#FAEDCB', // Light Cream Yellow
    '#C9E4DE', // Mint Aqua
    '#C6DEF1', // Baby Blue
    '#DBCDF0', // Lavender Purple
    '#F2C6DE', // Soft Pink
    '#F7D9C4'  // Peach Beige
  ]

  useEffect(() => {
    // Check authentication
    const authStatus = localStorage.getItem('isAuthenticated')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
      setCheckingAuth(false)
      fetchProjects()
    } else {
      router.push('/login')
    }
  }, [router])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Fetch bug counts for each project
      const projectsWithCounts = await Promise.all(
        (data || []).map(async (project) => {
          const { count } = await supabase
            .from('bugs')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)
          
          return { ...project, bugCount: count || 0 }
        })
      )
      
      setProjects(projectsWithCounts)
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (name: string, description: string) => {
    try {
      console.log('Creating project:', name)
      
      // Create the project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert([{ name, description }])
        .select()
        .single()

      if (projectError) {
        console.error('Project creation error:', projectError)
        throw projectError
      }

      console.log('Project created successfully:', projectData.id)
      console.log('Now creating example bug TP-0...')

      // Create example bug (TP-0) for the new project
      const { data: bugData, error: bugError } = await supabase
        .from('bugs')
        .insert([{
          project_id: projectData.id,
          portal: 'Customer Side',
          priority: 'Minor',
          status: 'Not a Bug',
          assigned_to: 'Developer',
          module_feature: 'Example Bug',
          bug_description: 'Please give us a detailed description of the bug or the issue you would like clarity on',
          bug_link: 'Please attach any links of screenshots/videos to help reproduce the bug',
          client_notes: 'Clients can add context or feedback to the bugs',
          developer_notes: 'Developers will provide updates if any in this section'
        }])
        .select()

      if (bugError) {
        console.error('Error creating example bug:', bugError)
        alert(`Failed to create example bug TP-0: ${bugError.message}`)
        // Don't throw - project was created successfully
      } else {
        console.log('Example bug TP-0 created successfully:', bugData)
      }

      setProjects([{ ...projectData, bugCount: 1 }, ...projects])
      setShowProjectForm(false)
    } catch (error) {
      console.error('Error creating project:', error)
      alert(`Error creating project: ${error}`)
    }
  }

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm('Are you sure you want to delete this project? All associated bugs will also be deleted.')) {
      return
    }

    try {
      // First delete all bugs associated with the project
      const { error: bugsError } = await supabase
        .from('bugs')
        .delete()
        .eq('project_id', projectId)

      if (bugsError) throw bugsError

      // Then delete the project
      const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (projectError) throw projectError

      setProjects(projects.filter(p => p.id !== projectId))
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    router.push('/login')
  }

  // Filter projects based on search query
  const filteredProjects = projects.filter(project => {
    const searchLower = searchQuery.toLowerCase()
    const nameMatch = project.name.toLowerCase().includes(searchLower)
    const descriptionMatch = project.description?.toLowerCase().includes(searchLower) || false
    return nameMatch || descriptionMatch
  })

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-xl text-white">Loading...</div>
      </div>
    )
  }

  // If not authenticated, return null (router.push will handle redirect)
  if (!isAuthenticated) {
    return null
  }

  if (loading) {
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
      <div className="relative z-10">
        {/* Header with glassmorphism */}
        <div className="backdrop-blur-md bg-white/5 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <img 
                  src="/logo.png" 
                  alt="Tracepoint Logo" 
                  className="w-12 h-12 sm:w-20 sm:h-20"
                />
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Tracepoint</h1>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowProjectForm(true)}
                  className="flex-1 sm:flex-none backdrop-blur-md bg-[#1e316d]/80 hover:bg-[#2a4494]/80 border border-white/20 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-all shadow-lg text-sm sm:text-base"
                >
                  New Project
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 sm:flex-none backdrop-blur-md bg-red-600/80 hover:bg-red-700/80 border border-white/20 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-all shadow-lg text-sm sm:text-base"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {showProjectForm && (
            <ProjectForm
              onSubmit={handleCreateProject}
              onCancel={() => setShowProjectForm(false)}
            />
          )}

          <div className="space-y-6">
            {/* Search Bar */}
            <div className="backdrop-blur-md bg-white/10 rounded-lg shadow-xl border border-white/20 p-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search projects by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e316d] focus:border-transparent text-white placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="w-5 h-5 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-white">Your Projects</h2>
              {searchQuery && (
                <span className="text-gray-400 text-sm">
                  {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} found
                </span>
              )}
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-4">No projects yet</div>
                <button
                  onClick={() => setShowProjectForm(true)}
                  className="bg-[#1e316d] hover:bg-[#2a4494] text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg"
                >
                  Create Your First Project
                </button>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12 backdrop-blur-md bg-white/10 rounded-lg shadow-xl border border-white/20">
                <div className="text-gray-400 text-lg mb-2">No projects found</div>
                <div className="text-gray-500 text-sm">Try adjusting your search terms</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project, index) => {
                  const cardColor = cardColors[index % cardColors.length]
                  return (
                  <div key={project.id} className="relative group">
                    <Link
                      href={`/project/${project.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block backdrop-blur-md rounded-lg border border-white/30 p-6 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-2"
                      style={{
                        background: `linear-gradient(135deg, ${cardColor}30, ${cardColor}10)`,
                        backdropFilter: 'blur(12px)'
                      }}
                    >
                        <h3 className="text-xl font-semibold text-white mb-2 drop-shadow-lg">
                          {project.name}
                        </h3>
                        {project.description && (
                          <p className="text-white/90 mb-4 line-clamp-2 drop-shadow-md">{project.description}</p>
                        )}
                        <div className="space-y-2">
                          <div className="text-sm text-white/80 drop-shadow-md">
                            Created {new Date(project.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-white/80 drop-shadow-md">
                            <span className="text-[#1e316d] font-semibold bg-white/90 px-2 py-0.5 rounded">Total Bugs:</span> <span className="font-semibold">{project.bugCount || 0}</span>
                          </div>
                        </div>
                      </Link>
                      <button
                        onClick={(e) => handleDeleteProject(project.id, e)}
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg shadow-lg z-10"
                        title="Delete Project"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}