// server.js
import express from 'express'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const METABASE_SITE = process.env.METABASE_SITE
const METABASE_SECRET = process.env.METABASE_SECRET

app.post('/api/dashboard', async (req, res) => {
  const { token } = req.body
  if (!token) return res.status(400).json({ error: 'Missing Supabase token' })

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Invalid or expired token' })

  const email = user.email

  const { data, error: dbError } = await supabase
    .from('permitted_users')
    .select('dashboard_id')
    .eq('email', email)
    .single()

  if (dbError || !data) return res.status(403).json({ error: 'User not permitted' })

  const dashboardId = data.dashboard_id

  const payload = {
    resource: { dashboard: dashboardId },
    params: {},
    exp: Math.floor(Date.now() / 1000) + (10 * 60)
  }

  const metabaseToken = jwt.sign(payload, METABASE_SECRET)
  const embedUrl = `${METABASE_SITE}/embed/dashboard/${metabaseToken}#bordered=true&titled=true`

  res.json({ embed_url: embedUrl })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`))

