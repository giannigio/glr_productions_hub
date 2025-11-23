const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// --- JOBS ENDPOINTS ---

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
    const job = await prisma.job.update({
      where: { id: req.params.id },
      data: data
    });
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

// --- CREW ENDPOINTS ---
app.get('/api/crew', async (req, res) => {
  try {
    const crew = await prisma.crewMember.findMany();
    res.json(crew);
  } catch (e) { res.status(500).json(e); }
});

app.post('/api/crew', async (req, res) => {
  try {
    const crew = await prisma.crewMember.create({ data: req.body });
    res.json(crew);
  } catch (e) { res.status(500).json(e); }
});

app.put('/api/crew/:id', async (req, res) => {
  try {
    const { id, ...data } = req.body;
    const crew = await prisma.crewMember.update({ where: { id: req.params.id }, data });
    res.json(crew);
  } catch (e) { res.status(500).json(e); }
});

// --- INVENTORY ENDPOINTS ---
app.get('/api/inventory', async (req, res) => {
  try {
    const inv = await prisma.inventoryItem.findMany();
    res.json(inv);
  } catch (e) { res.status(500).json(e); }
});

app.post('/api/inventory', async (req, res) => {
  try {
    const inv = await prisma.inventoryItem.create({ data: req.body });
    res.json(inv);
  } catch (e) { res.status(500).json(e); }
});

app.delete('/api/inventory/:id', async (req, res) => {
  try {
    await prisma.inventoryItem.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json(e); }
});

// --- LOCATIONS ENDPOINTS ---
app.get('/api/locations', async (req, res) => {
  try {
    const locs = await prisma.location.findMany();
    res.json(locs);
  } catch (e) { res.status(500).json(e); }
});

app.post('/api/locations', async (req, res) => {
  try {
    const loc = await prisma.location.create({ data: req.body });
    res.json(loc);
  } catch (e) { res.status(500).json(e); }
});

app.put('/api/locations/:id', async (req, res) => {
  try {
    const { id, ...data } = req.body;
    const loc = await prisma.location.update({ where: { id: req.params.id }, data });
    res.json(loc);
  } catch (e) { res.status(500).json(e); }
});

app.delete('/api/locations/:id', async (req, res) => {
  try {
    await prisma.location.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json(e); }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});