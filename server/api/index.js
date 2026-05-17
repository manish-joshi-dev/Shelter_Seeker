import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import userRouter from "../api/routes/user.route.js"
import userAuth from "../api/routes/auth.route.js"
import userListing from "../api/routes/listing.route.js"
import chatRoutes from "../api/routes/chat.route.js"
import localityInsightRoutes from "../api/routes/localityInsight.route.js"
import adminRoutes from "../api/routes/admin.route.js"
import reportRoutes from "../api/routes/report.route.js"
import trustRoutes from "../api/routes/trust.route.js"
import uploadRoutes from "../api/routes/upload.route.js"
import cookieParser from "cookie-parser"
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import Conversation from "../api/model/conversation.model.js";
import { getLocalityName } from "./utils/locality.js"




const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });



mongoose.connect(process.env.MONGO).then(()=>{
    console.log('Connected to mongoDB!!');
    
}).catch((err)=>{
    console.log(err);
    
})
const app = express();

const port = 3001;
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
// Allow multiple origins for development
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// app.get('/test', (req, res) => {
//   res.send('Hello World!')
// })
app.use('/api/user',userRouter);
app.use('/api/auth',userAuth);
app.use('/api/listing',userListing);
app.use('/api/chat',chatRoutes);
app.use('/api/locality-insights',localityInsightRoutes);
app.use('/api/admin',adminRoutes);
app.use('/api/reports',reportRoutes);
app.use('/api/trust',trustRoutes);
app.use('/api/upload',uploadRoutes);

// console.log(await getLocalityName([80.402052, 22.617726])+ " it is ");
app.use((err,req,res,next)=>{
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json(
    {
      success:false,
      statusCode,
      message
       
    }
  );
})

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// In-memory presence map
const userIdToSocketIds = new Map();

io.on('connection', (socket) => {
  // Expect `userId` in query for identification
  const { userId } = socket.handshake.query || {};

  if (userId && typeof userId === 'string') {
    const existing = userIdToSocketIds.get(userId) || new Set();
    existing.add(socket.id);
    userIdToSocketIds.set(userId, existing);
  }

  socket.on('join_conversation', ({ conversationId }) => {
    if (!conversationId) return;
    socket.join(conversationId);
    socket.emit('joined_conversation', { conversationId });
  });

  socket.on('chat_message', async (payload) => {
    try {
      const { conversationId, listingId, landlordId, tenantId, message } = payload || {};
      if (!conversationId || !listingId || !landlordId || !tenantId || !message) return;

      // Persist to DB
      const update = {
        $setOnInsert: { conversationId, listingId, landlordId, tenantId },
        $push: { messages: { senderId: message.senderId, senderName: message.senderName, text: message.text, createdAt: new Date() } },
      };
      const opts = { new: true, upsert: true };
      await Conversation.findOneAndUpdate({ listingId, landlordId, tenantId }, update, opts);

      // Broadcast to everyone in the room (including sender for consistency)
      io.to(conversationId).emit('chat_message', {
        ...message,
        conversationId,
        serverTimestamp: Date.now(),
      });
    } catch (e) {
      // swallow socket error; optionally emit error event
    }
  });

  socket.on('typing', ({ conversationId, userId: typingUserId, isTyping }) => {
    if (!conversationId || !typingUserId) return;
    socket.to(conversationId).emit('typing', { conversationId, userId: typingUserId, isTyping: !!isTyping });
  });

  socket.on('disconnect', () => {
    if (userId && userIdToSocketIds.has(userId)) {
      const set = userIdToSocketIds.get(userId);
      set.delete(socket.id);
      if (set.size === 0) userIdToSocketIds.delete(userId);
    }
  });
});

server.listen(port, () => {
  console.log(`HTTP and Socket.IO server listening on port ${port} !!`)
});
