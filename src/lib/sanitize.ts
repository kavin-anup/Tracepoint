/**
 * Input Sanitization Utilities
 * Prevents XSS attacks by sanitizing user input
 */

/**
 * Sanitize HTML string to prevent XSS attacks
 * Removes potentially dangerous HTML tags and attributes
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '')
  sanitized = sanitized.replace(/on\w+='[^']*'/gi, '')
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '')
  
  // Remove data: URLs that could be dangerous
  sanitized = sanitized.replace(/data:text\/html/gi, '')
  
  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
  
  // Remove object and embed tags
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
  sanitized = sanitized.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
  
  return sanitized.trim()
}

/**
 * Sanitize plain text input
 * Removes HTML tags and dangerous characters
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  // Remove HTML tags
  let sanitized = text.replace(/<[^>]*>/g, '')
  
  // Decode HTML entities
  sanitized = sanitized
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
  
  return sanitized.trim()
}

/**
 * Validate and sanitize URL
 * Ensures URL is safe and from allowed domains
 */
export function sanitizeUrl(url: string, allowedDomains: string[] = []): string | null {
  if (!url || typeof url !== 'string') {
    return null
  }

  try {
    const urlObj = new URL(url)
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null
    }
    
    // If allowed domains specified, check against them
    if (allowedDomains.length > 0) {
      const hostname = urlObj.hostname.toLowerCase()
      const isAllowed = allowedDomains.some(domain => 
        hostname === domain.toLowerCase() || hostname.endsWith('.' + domain.toLowerCase())
      )
      
      if (!isAllowed) {
        return null
      }
    }
    
    return urlObj.toString()
  } catch {
    // Invalid URL
    return null
  }
}

/**
 * Sanitize file name
 * Removes dangerous characters and path traversal attempts
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    return 'file'
  }

  // Remove path traversal attempts
  let sanitized = fileName.replace(/\.\./g, '')
  sanitized = sanitized.replace(/\//g, '_')
  sanitized = sanitized.replace(/\\/g, '_')
  
  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1F]/g, '')
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'))
    sanitized = sanitized.substring(0, 255 - ext.length) + ext
  }
  
  return sanitized || 'file'
}

/**
 * Validate and limit string length
 */
export function validateLength(text: string, maxLength: number, minLength: number = 0): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  if (text.length < minLength) {
    return text
  }

  if (text.length > maxLength) {
    return text.substring(0, maxLength)
  }

  return text
}

/**
 * Escape special characters for use in HTML
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }

  return text.replace(/[&<>"']/g, (char) => map[char])
}

