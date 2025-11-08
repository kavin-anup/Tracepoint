// ============================================
// CREATE USER VIA SUPABASE ADMIN API (RECOMMENDED)
// ============================================
// Run this with: node create-user-kavin.js
// ============================================

const https = require('https')

const supabaseUrl = 'https://twqyzkwvulgcfhzfjbea.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3cXl6a3d2dWxnY2ZoemZqYmVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAzMjU0NSwiZXhwIjoyMDc1NjA4NTQ1fQ.LABFQA51I-jamGZO7mk1xvc-I7WCmFQyq6RTVDiEXkA'

const userData = {
  email: 'kavin@boostmysites.com',
  password: 'TracepoinT777',
  email_confirm: true, // Auto-confirm the email
  user_metadata: {
    name: 'Kavin'
  }
}

const postData = JSON.stringify(userData)

const options = {
  hostname: 'twqyzkwvulgcfhzfjbea.supabase.co',
  path: '/auth/v1/admin/users',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'Content-Length': Buffer.byteLength(postData)
  }
}

const req = https.request(options, (res) => {
  let data = ''

  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ User created successfully!')
      console.log('Response:', JSON.parse(data))
      console.log()
      console.log('Login credentials:')
      console.log('Email: kavin@boostmysites.com')
      console.log('Password: TracepoinT777')
    } else {
      console.error('❌ Error creating user:')
      console.error(`Status: ${res.statusCode}`)
      console.error('Response:', data)
      
      // Check if user already exists
      if (data.includes('already registered') || data.includes('already exists')) {
        console.log()
        console.log('⚠️  User might already exist. Try logging in with:')
        console.log('Email: kavin@boostmysites.com')
        console.log('Password: TracepoinT777')
      }
    }
  })
})

req.on('error', (error) => {
  console.error('❌ Request error:', error)
})

req.write(postData)
req.end()

