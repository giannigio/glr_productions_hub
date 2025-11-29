const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { supabase } = require('./supabaseClient');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const handleResponse = (res, promise) => {
  promise
    .then(({ data, error }) => {
      if (error) {
        console.error('Supabase error:', error);
        res.status(500).json({ error: error.message });
      } else {
        res.json(data);
      }
    })
    .catch((err) => {
      console.error('Unexpected error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
};

// --- AUTH ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    return res.status(401).json({ success: false, message: 'Credenziali non valide' });
  }

  if (user.password !== password) {
    return res.status(401).json({ success: false, message: 'Credenziali non valide' });
  }

  let crewMember = null;
  if (user.crew_member_id) {
    const { data: crewData } = await supabase
      .from('crew_members')
      .select('*')
      .eq('id', user.crew_member_id)
      .single();
    crewMember = crewData;
  }

  res.json({
    success: true,
    user: {
      ...(crewMember || {}),
      email: user.email,
      accessRole: user.role,
    },
    token: 'supabase-session-mock',
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Helper to build CRUD endpoints quickly
const registerCrudRoutes = (path, table) => {
  app.get(`/api/${path}`, async (req, res) => {
    handleResponse(res, supabase.from(table).select('*'));
  });

  app.post(`/api/${path}`, async (req, res) => {
    handleResponse(
      res,
      supabase
        .from(table)
        .insert(req.body)
        .select()
        .single()
    );
  });

  app.put(`/api/${path}/:id`, async (req, res) => {
    const { id } = req.params;
    const payload = { ...req.body };
    delete payload.id;

    handleResponse(
      res,
      supabase
        .from(table)
        .update(payload)
        .eq('id', id)
        .select()
        .single()
    );
  });

  app.delete(`/api/${path}/:id`, async (req, res) => {
    const { id } = req.params;
    handleResponse(res, supabase.from(table).delete().eq('id', id));
  });
};

registerCrudRoutes('jobs', 'jobs');
registerCrudRoutes('locations', 'locations');
registerCrudRoutes('inventory', 'inventory_items');
registerCrudRoutes('standard-lists', 'standard_material_lists');
registerCrudRoutes('rentals', 'rentals');
registerCrudRoutes('company-expenses', 'company_expenses');
registerCrudRoutes('recurring-payments', 'recurring_payments');
registerCrudRoutes('personnel-costs', 'personnel_costs');

// Crew uses upsert to allow create/update via same call
app.get('/api/crew', async (req, res) => {
  handleResponse(res, supabase.from('crew_members').select('*'));
});

app.put('/api/crew/:id', async (req, res) => {
  const { id } = req.params;
  const payload = { ...req.body, id };
  handleResponse(
    res,
    supabase
      .from('crew_members')
      .upsert(payload)
      .select()
      .single()
  );
});

// Settings saved as single row (id = 1)
app.get('/api/settings', async (req, res) => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('settings')
    .eq('id', 1)
    .single();

  if (error && error.code !== 'PGRST116') {
    return res.status(500).json({ error: error.message });
  }

  res.json(data?.settings || { companyName: 'GLR Productions' });
});

app.put('/api/settings', async (req, res) => {
  const payload = { id: 1, settings: req.body };
  handleResponse(
    res,
    supabase
      .from('app_settings')
      .upsert(payload)
      .select('settings')
      .single()
  );
});

// Notifications placeholder
app.get('/api/notifications', (req, res) => {
  res.json([]);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
