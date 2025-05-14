/*
Welcome to JP Learning - Using MySQL Instead of MongoDB
*/
const express = require('express');
const mqtt = require('mqtt');
const shortId = require('shortid');
const moment = require('moment');
const cors = require('cors');

const app = express();
const port = 8080;
app.use(express.json());
app.use(cors());
app.options('*', cors());

const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: '*'
    }
});

// Sequelize DB Connection
const sequelize = require('./db');

// Import Models
const Users = require('./models/usersModel');
const Events = require('./models/eventsModel');

// Create Tables
sequelize.sync();

// User Routes
app.post('/users', async (req, res) => {
    try {
        const user = await Users.create(req.body);
        return res.status(201).json(user);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.get('/users', async (req, res) => {
    const users = await Users.findAll();
    return res.status(200).json(users);
});

app.get('/users/:id', async (req, res) => {
    const user = await Users.findByPk(req.params.id);
    return res.status(200).json(user);
});

app.put('/users/:id', async (req, res) => {
    await Users.update(req.body, { where: { id: req.params.id } });
    const updatedUser = await Users.findByPk(req.params.id);
    return res.status(200).json(updatedUser);
});

app.delete('/users/:id', async (req, res) => {
    await Users.destroy({ where: { id: req.params.id } });
    return res.status(200).json({ message: 'User deleted' });
});

// Events Routes
app.get('/events/:deviceId', async (req, res) => {
    let events = [];
    const types = ['Connection', 'Temperature', 'Humidity', 'Light'];
    for (let type of types) {
        const event = await Events.findOne({
            where: { device_id: req.params.deviceId, type },
            order: [['created', 'DESC']]
        });
        if (event) events.push(event);
    }
    return res.status(200).json(events);
});

app.get('/events/deviceId/:deviceId/type/:type', async (req, res) => {
    const events = await Events.findAll({
        where: { device_id: req.params.deviceId, type: req.params.type }
    });
    return res.status(200).json(events);
});

app.get('/events/last/deviceId/:deviceId/type/:type', async (req, res) => {
    const event = await Events.findOne({
        where: { device_id: req.params.deviceId, type: req.params.type },
        order: [['created', 'DESC']]
    });
    return res.status(200).json(event);
});

server.listen(port, () => {
    console.log(`App running on http://localhost:${port}`);
});

// WebSocket
const topic_ws_receive = 'JPLearning_CommandRequest';
const topic_ws_send = 'JPLearning_SensorData';

io.on('connection', (client) => {
    console.log('WS Client Connected:', client.id);
    client.on(topic_ws_receive, async (data) => {
        console.log('[WS Received]', data);
        await sendToDevice(topic_mqtt_send, data);
    });
});

const sendToApplicaiton = async (topic, msg) => {
    console.log('[WS Sending]', msg);
    io.emit(topic, msg);
};

// MQTT
const topic_mqtt_receive_events = 'JPLearning_SensorData';
const topic_mqtt_receive_connections = '$SYS/broker/log/#';
const topic_mqtt_send = 'JPLearning_CommandRequest';

const options = {
    host: '192.168.2.150',
    port: 1883,
    protocol: 'mqtt',
    username: 'testing2',
    password: 'testing2',
    clientId: 'Application_' + Math.random().toString(16).substring(2, 8)
};

const client = mqtt.connect(options);

client.on('connect', () => {
    console.log('MQTT Connected');
    client.subscribe(topic_mqtt_receive_events);
    client.subscribe(topic_mqtt_receive_connections);
});

client.on('error', (error) => {
    console.error('MQTT error:', error);
});

const connectedRegex = /New client connected from .+ as (\S+) \(.+ u'([^']+)'\)/;
const disconnectedRegex = /Client (\S+) disconnected/;

client.on('message', async (topic, message) => {
    const msg = message.toString();
    if (topic.startsWith('$SYS/broker/log/')) {
        const connectedMatch = msg.match(connectedRegex);
        const disconnectedMatch = msg.match(disconnectedRegex);
        let clientId, status;

        if (connectedMatch) {
            clientId = connectedMatch[1];
            status = 1;
        } else if (disconnectedMatch) {
            clientId = disconnectedMatch[1];
            status = 0;
        }

        if (clientId?.startsWith('Deivce_')) {
            const data = {
                _id: shortId.generate(),
                device_id: clientId.split('_')[1],
                type: 'Connection',
                value: status,
                created: moment().utc().add(5, 'hours').toDate()
            };
            await saveData(data);
        }
    }

    if (topic === topic_mqtt_receive_events) {
        const data = JSON.parse(msg);
        data._id = shortId.generate();
        data.created = moment().utc().add(5, 'hours').toDate();
        await saveData(data);
    }
});

const saveData = async (data) => {
    try {
        const saved = await Events.create(data);
        console.log('Saved:', saved);
        await sendToApplicaiton(topic_ws_send, saved);
    } catch (error) {
        console.error('Save error:', error);
    }
};

const sendToDevice = async (topic, message) => {
    const data = JSON.stringify(message);
    client.publish(topic, data);
};
