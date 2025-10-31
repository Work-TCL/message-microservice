import { Server, Socket } from "socket.io";
import { createServer } from "http";
import app from "./app";
import { markAllMessagesRead, markMessagesAsRead, saveCollaborationMessage } from "./controller/collaboration/collaboration.controller";
import { addNewBid, markAllBidsAsSeen, markBidAsSeen } from "./controller/bidding/bidding.controller";

// Create the HTTP server from Express app
const httpServer = createServer(app);

// Initialize Socket.IO with proper CORS config
const io = new Server(httpServer, {
  cors: {
    origin: "*", // ⚠️ Use specific domains in production
  },
});

// Types for events
interface BidRequestData {
  collaborationId: string;
  proposal: number;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  sender: "vendor" | "creator";
}

interface CollaborationMessageData {
  message: string;
  creatorId?: string;
  vendorId?: string;
}

/**
 * Handle new socket connections
 */
io.on("connection", (socket: Socket) => {
  console.log("A user connected");

  /**
   * Register user to a personal room for private messaging or notifications
   */
  socket.on("register", (userId: string) => {
    socket.join(userId);
    console.log(`User ${userId} registered`);
  });

  /**
   * Join a collaboration room (used for chat and bidding in a collab)
   */
  socket.on("joinCollaboration", (collaborationId: string) => {
    joinCollaborationRoom(socket, collaborationId);
  });

  /**
   * Handle incoming bid request
   */
  socket.on("bidRequest", async (body: BidRequestData) => {
    const { collaborationId } = body;
    try {
      const bid = await addNewBid(body);

      if (bid) {
        io.to(collaborationId).emit("newBid", {
          message: `New bid added`,
          data: bid,
          collaborationId: collaborationId
        });
      }
    } catch (e) {
      console.error("Error while adding new bid", e);
      io.to(collaborationId).emit("bid-error", {
        message: "Failed to add bid",
        collaborationId
      });
    }
  });

  socket.on("markBidAsSeen", async (data: { bidId: string; type: string; }) => {
    try {
      await markBidAsSeen(data.bidId, data.type);
    } catch (error) {
      console.error("Error marking bid as seen:", error);
      socket.emit("error", { message: "Failed to mark bid as seen" });
    }
  });

  socket.on("markAllBidsAsSeen", async (data: { collaborationId: string; type: string;}) => {
    try {
      await markAllBidsAsSeen(data.collaborationId, data.type);
    } catch (error) {
      console.error("Error marking all bids as seen:", error);
      socket.emit("error", { message: "Failed to mark all bids as seen" }); 
    }
  });
  

  /**
   * Handle disconnection
   */
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

/**
 * Helper: Send notification to specific users by ID
 */
export const sendNotification = (userIds: string[], message: string) => {
  userIds.forEach((userId) => {
    io.to(userId).emit("notification", { message });
  });
};

export const sendCollaborationNotification = (userIds: string[], payload: any) => {
  userIds.forEach((userId) => {
    io.to(userId).emit("notification",  payload);
  });
};

/**
 * Helper: Join a collaboration room and set up collaboration message events
 */
export const joinCollaborationRoom = (
  socket: Socket,
  collaborationId: string
) => {
  socket.join(collaborationId);
  socket.emit("joinedCollaborationRoom", {
    message: `Joined collaboration room successfully: ${collaborationId}`,
  });
  console.log(`User joined collaboration room ${collaborationId}`);

  // Clean up existing listener for that room
  socket.removeAllListeners("collaborationMessage");

  /**
   * Handle collaboration messages (chat-style)
   */
  socket.on("collaborationMessage", async (data: CollaborationMessageData) => {
    try {
      console.log("Collaboration message received:", data);

      const newMessage = await saveCollaborationMessage({
        collaborationId,
        message: data.message,
        creatorId: data.creatorId,
        vendorId: data.vendorId,
      });

      if (newMessage) {
        io.to(collaborationId).emit("newCollaborationMessage", {
          message: newMessage,
          collaborationId
        });
      }
    } catch (error) {
      console.error("Error saving collaboration message", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Inside `joinCollaborationRoom` after other socket events
  socket.on(
    "markMessagesAsRead",
    async (data: { collaborationId: string; vendorId?: string; creatorId?: string; }) => {
      try {
        await markMessagesAsRead(data.collaborationId, data.vendorId, data.creatorId);

        // Optionally notify other users in the room
        // socket.to(data.collaborationId).emit("messagesRead", {
        //   collaborationId: data.collaborationId,
        //   userId: data.userId,
        // });
      } catch (error) {
        console.error("Error marking messages as read:", error);
        socket.emit("error", { message: "Failed to mark messages as read" });
      }
    }
  );

  socket.on("markAllMessagesAsRead", async (data: { collaborationId: string; type: string}) => {
    try {
      await markAllMessagesRead(data.collaborationId, data.type);
    } catch (error) {
      console.error("Error marking all messages as read:", error);
      socket.emit("error", { message: "Failed to mark all messages as read" });
    }
  });
  /**
   * Allow user to leave collaboration room
   */
  socket.on("leaveCollaboration", () => {
    socket.leave(collaborationId);
    socket.emit("leftCollaborationRoom", {
      message: `Left collaboration room ${collaborationId}`,
    });

    // Remove chat listener to avoid memory leaks
    socket.removeAllListeners("collaborationMessage");
  });
};

// Export initialized server and socket instance
export { io, httpServer };
