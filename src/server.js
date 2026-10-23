const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const db = require('./config/dbStore');
const seed = require('./utils/seedData');
const notificationService = require('./services/notification.service');

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH']
  }
});

notificationService.setIO(io);

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`[Socket.io] Socket ${socket.id} joined user-${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

async function startServer() {
  try {
    await db.init();
    if (!db.data.appointments || db.data.appointments.length === 0) {
      console.log('[Server] Database is empty. Running initial seed...');
      await seed();
    }
    server.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 ZenOnco Appointment Management System is running!`);
      console.log(`🌐 Local URL: http://localhost:${PORT}`);
      console.log(`Doctor URL: http://localhost:${PORT}/doctors`)
      console.log(`📊 Total Appointments Loaded: ${db.data.appointments.length}`);
      console.log(`👥 Active Agents: ${db.data.users.length}`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('[Server] Fatal Error during startup:', err);
    process.exit(1);
  }
}

startServer();
