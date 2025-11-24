const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- SEEDING DEFAULT ADMIN ---
async function seedDefaultAdmin() {
  const adminEmail = 'admin@glr.it';
  const adminPassword = 'giovanni'; // password in chiaro per ora

  try {
    // Cerco un crew interno con questa email
    const existingCrew = await prisma.crewMember.findFirst({
      where: {
        email: adminEmail,
        type: 'Interno',
      },
    });

    if (existingCrew) {
      console.log('Admin crew member already exists, ensuring User row...');

      // Mi assicuro che esista anche l'utente collegato nella tabella User
      await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
          email: adminEmail,
          password: adminPassword,
          role: 'ADMIN',
          crewMemberId: existingCrew.id,
        },
      });

      console.log('Admin user ensured in User table.');
      return;
    }

    console.log('Seeding default admin user (CrewMember + User)...');

    // Creo il CrewMember admin (id generato da Prisma con @default(uuid()))
    const crewMember = await prisma.crewMember.create({
      data: {
        name: 'Amministratore',
        type: 'Interno',
        roles: ['PROJECT_MGR'],
        dailyRate: 0,
        email: adminEmail,
        password: adminPassword,
        accessRole: 'ADMIN',
        phone: '0000000000',
        absences: [],
        expenses: [],
        tasks: [],
        documents: [],
        financialDocuments: [],
      },
    });

    console.log('Created admin crew member with id:', crewMember.id);

    // Creo anche la riga corrispondente in User
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: adminPassword,
        role: 'ADMIN',
        crewMemberId: crewMember.id,
      },
    });

    console.log('Default admin created: admin@glr.it / giovanni');
  } catch (e) {
    console.error('Error seeding admin:', e);
  }
}

// Run seed on start
seedDefaultAdmin();

// --- AUTH ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.crewMember.findFirst({
      where: {
        email: email,
        type: 'Interno', // Only internal staff can login
      },
    });

    if (user && user.password === password) {
      // IN PRODUCTION: Generate JWT Token here
      const { password, ...userWithoutPass } = user;
      res.json({
        success: true,
        user: userWithoutPass,
        token: 'mock-jwt-token-12345', // Replace with real JWT
      });
    } else {
      res.status(401).json({ success: false, message: 'Credenziali non valide' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// --- JOBS ---
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({ orderBy: { startDate: 'desc' } });
    res.json(jobs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    const job = await prisma.job.create({ data: req.body });
    res.json(job);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/jobs/:id', async (req, res) => {
  try {
    const { id, ...data } = req.body;
    const job = await prisma.job.update({ where: { id: req.params.id }, data });
    res.json(job);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/jobs/:id', async (req, res) => {
  try {
    await prisma.job.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- CREW ---
app.get('/api/crew', async (req, res) => {
  try {
    const crew = await prisma.crewMember.findMany();
    res.json(crew);
  } catch (e) {
    res.status(500).json(e);
  }
});

app.post('/api/crew', async (req, res) => {
  try {
    const crew = await prisma.crewMember.create({ data: req.body });
    res.json(crew);
  } catch (e) {
    res.status(500).json(e);
  }
});

app.put('/api/crew/:id', async (req, res) => {
  try {
    const { id, ...data } = req.body;
    const crew = await prisma.crewMember.update({ where: { id: req.params.id }, data });
    res.json(crew);
  } catch (e) {
    res.status(500).json(e);
  }
});

// --- LOCATIONS ---
app.get('/api/locations', async (req, res) => {
  try {
    const locs = await prisma.location.findMany();
    res.json(locs);
  } catch (e) {
    res.status(500).json(e);
  }
});

app.post('/api/locations', async (req, res) => {
  try {
    const loc = await prisma.location.create({ data: req.body });
    res.json(loc);
  } catch (e) {
    res.status(500).json(e);
  }
});

app.put('/api/locations/:id', async (req, res) => {
  try {
    const { id, ...data } = req.body;
    const loc = await prisma.location.update({ where: { id: req.params.id }, data });
    res.json(loc);
  } catch (e) {
    res.status(500).json(e);
  }
});

app.delete('/api/locations/:id', async (req, res) => {
  try {
    await prisma.location.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json(e);
  }
});

// --- INVENTORY ---
app.get('/api/inventory', async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany();
    res.json(items);
  } catch (e) {
    res.status(500).json(e);
  }
});

app.post('/api/inventory', async (req, res) => {
  try {
    const item = await prisma.inventoryItem.create({ data: req.body });
    res.json(item);
  } catch (e) {
    res.status(500).json(e);
  }
});

app.put('/api/inventory/:id', async (req, res) => {
  try {
    const { id, ...data } = req.body;
    const item = await prisma.inventoryItem.update({ where: { id: req.params.id }, data });
    res.json(item);
  } catch (e) {
    res.status(500).json(e);
  }
});

app.delete('/api/inventory/:id', async (req, res) => {
  try {
    await prisma.inventoryItem.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json(e);
  }
});

// --- SETTINGS ---
app.get('/api/settings', async (req, res) => {
  try {
    const config = await prisma.appSettings.findFirst();
    if (config) {
      res.json(config.settings);
    } else {
      res.json({ companyName: 'GLR Productions' });
    }
  } catch (e) {
    res.status(500).json(e);
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const config = await prisma.appSettings.upsert({
      where: { id: 1 },
      update: { settings: req.body },
      create: { id: 1, settings: req.body },
    });
    res.json(config.settings);
  } catch (e) {
    res.status(500).json(e);
  }
});

// --- NOTIFICATIONS (Mock for now) ---
app.get('/api/notifications', (req, res) => {
  res.json([]);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
