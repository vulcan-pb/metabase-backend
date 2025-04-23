require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
// you will need to install via 'npm install jsonwebtoken' or in your package.json

const jwt = require("jsonwebtoken");

const METABASE_SITE_URL = "http://metabase-railway-production-ea23.up.railway.app";
const METABASE_SECRET_KEY = "6009f6e3b7482f244b5416b1b37351857d7511ec4f28b220fe7815172f684b91";

const payload = {
  resource: { dashboard: 2 },
  params: {},
  exp: Math.round(Date.now() / 1000) + (10 * 60) // 10 minute expiration
};
const token = jwt.sign(payload, METABASE_SECRET_KEY);

const iframeUrl = METABASE_SITE_URL + "/embed/dashboard/" + token +
  "#bordered=true&titled=true";

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { data: user, error } = await supabase
    .from('users')
    .select('password,dashboard_url')
    .eq('email', email)
    .single();

  if (error || !user) {
    return res.status(401).json({ error: 'User not found' });
  }

  if (user.password !== password) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  return res.json({ dashboard_url: user.dashboard_url });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
