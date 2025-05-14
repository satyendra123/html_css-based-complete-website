const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');

// Express App
const app = express();
const port = 8080;
app.use(express.json());
app.use(cors());

// MySQL Database Connection
const sequelize = new Sequelize('student_db', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
});

// Define Model
const Item = sequelize.define('Item', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    }
}, {
    timestamps: true
});

// Sync DB
sequelize.sync()
    .then(() => console.log('Database connected and synced'))
    .catch(err => console.error('DB Error:', err));

// Routes

// Create Item
app.post('/items', async (req, res) => {
    try {
        const item = await Item.create(req.body);
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get All Items
app.get('/items', async (req, res) => {
    const items = await Item.findAll();
    res.status(200).json(items);
});

// Get One Item
app.get('/items/:id', async (req, res) => {
    const item = await Item.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.status(200).json(item);
});

// Update Item
app.put('/items/:id', async (req, res) => {
    const updated = await Item.update(req.body, { where: { id: req.params.id } });
    if (updated[0] === 0) return res.status(404).json({ message: 'Item not found' });
    const item = await Item.findByPk(req.params.id);
    res.status(200).json(item);
});

// Delete Item
app.delete('/items/:id', async (req, res) => {
    const deleted = await Item.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: 'Item not found' });
    res.status(200).json({ message: 'Item deleted' });
});

// Start Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
