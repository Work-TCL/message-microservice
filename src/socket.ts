import { Server } from 'socket.io';
import { createServer } from 'http';
import app from './app';
import { saveCollaborationMessage } from './controller/collaboration/collaboration.controller';

const httpServer = createServer(app);

// Initialize Socket.IO server with CORS configuration
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Change this to match the frontend's URL in production
        methods: ["GET", "POST"]
    }
});

// Handle socket connection event
io.on('connection', (socket) => {
    console.log('A user connected');

    /**
     * Register a user and associate them with a unique socket room (userId)
     * This helps in sending targeted notifications/messages
     */
    socket.on('register', (userId: string) => {
        socket.join(userId);
        console.log(`User ${userId} registered`);
    });

    /**
     * Join a collaboration room based on the provided collaborationId
     * Enables real-time messaging in a specific collaboration space
     */
    socket.on('joinCollaboration', (collaborationId: string) => {
        joinCollaborationRoom(socket, collaborationId);
    });

    // Handle user disconnect event
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

/**
 * Send real-time notifications to specific users
 * 
 * @param userIds - Array of user IDs to send notifications to
 * @param message - Notification message
 */
export const sendNotification = (userIds: string[], message: string) => {
    userIds.forEach(userId => {
        io.to(userId).emit('notification', { message });
    });
};

/**
 * Handle joining a collaboration room
 * 
 * @param socket - The socket instance of the connected user
 * @param collaborationId - ID of the collaboration room
 */
export const joinCollaborationRoom = (socket: any, collaborationId: string) => {
    socket.join(collaborationId);
    socket.emit('joinedCollaborationRoom', {
        message: `Joined collaboration room successfully: ${collaborationId}`
    });
    console.log(`User joined collaboration room ${collaborationId}`);

    /**
     * Listen for new messages in the collaboration room
     * The message is saved to the database and broadcasted to all users in the room
     */
    socket.on('collaborationMessage', async (data: { message: string; creatorId?: string; vendorId?: string }) => {
        try {
            console.log("data",data)
            // Save the message using the controller function
            const newMessage = await saveCollaborationMessage({
                collaborationId,
                message: data.message,
                creatorId: data.creatorId,
                vendorId: data.vendorId,
            });

            if (newMessage) {
                // Broadcast the new message to all users in the room
                io.to(collaborationId).emit('newCollaborationMessage', {
                    message: newMessage
                });
            }
        } catch (error) {
            // Send error message if message saving fails
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    /**
     * Handle user leaving the collaboration room
     * The user is removed from the socket room
     */
    socket.on('leaveCollaboration', () => {
        socket.leave(collaborationId);
        socket.emit('leftCollaborationRoom', {
            message: `Left collaboration room ${collaborationId}`
        });
    });
};

export { io, httpServer };
