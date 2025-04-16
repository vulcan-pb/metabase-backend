// server.js

const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const METABASE_SITE_URL = process.env.METABASE_SITE_URL;
const METABASE_SECRET_KEY = process.env.METABASE_SECRET_KEY;

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const {
    data: login,
    error: authError,
  } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !login.session) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Fetch dashboard ID from user_dashboards table
  const { data: dashboardRow, error: fetchError } = await supabase
    .from("user_dashboards")
    .select("dashboard_id")
    .eq("user_email", email)
    .single();

  if (fetchError || !dashboardRow) {
    return res.status(404).json({ error: "Dashboard not assigned to user" });
  }

  const dashboardId = dashboardRow.dashboard_id;

  // Create Metabase signed JWT
  const payload = {
    resource: { dashboard: dashboardId },
    params: {},
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };

  const token = jwt.sign(payload, METABASE_SECRET_KEY);
  const metabaseUrl = `${METABASE_SITE_URL}/embed/dashboard/${token}#bordered=true&titled=true`;

  return res.json({ metabaseUrl });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
