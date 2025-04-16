const express = require('express');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js'); // Supabase client

const app = express();
const port = 5000; // Set your desired backend port
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';  // Your Supabase anon key
const JWT_SECRET_KEY = 'your-secret-key'; // Your JWT secret key

// Create a Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Middleware to parse JSON body
app.use(express.json());

// Endpoint for login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Authenticate the user via Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Fetch user's dashboard URL from Supabase
    const { data: userData, error: dbError } = await supabase
      .from('users')  // Assuming 'users' table stores the email and dashboard URL
      .select('dashboard_url')
      .eq('email', email)
      .single();

    if (dbError || !userData) {
      return res.status(500).json({ error: 'Dashboard URL not found for user' });
    }

    // Create JWT payload with user info and dashboard URL
    const payload = {
      user_id: data.user.id,
      email: data.user.email,
      dashboard_url: userData.dashboard_url,  // Include the public dashboard URL
    };

    // Generate JWT token (valid for 1 hour)
    const token = jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: '1h' });

    // Send the JWT back to the frontend
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
