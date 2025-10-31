import { Request, Response } from "express";
import { MessagesModel } from "../../database/model";

/**
 * Controller to fetch collaboration messages with pagination.
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export const getCollaborationMessages = async (req: Request, res: Response) => {
    try {
        // Extract collaboration ID from request parameters
        const { collaborationId } = req.params;

        // Extract pagination values from query parameters, defaulting to page 1 and limit 20
        const { page = 1, limit = 20 } = req.query;

        // Calculate how many messages to skip based on the requested page
        const skip = (Number(page) - 1) * Number(limit);

        /**
         * Fetch messages from the database:
         * - Filters by collaboration ID
         * - Applies pagination (skip, limit)
         * - Sorts messages in descending order by creation time (latest first)
         * - Populates creatorId and vendorId fields to include user details
         */
        const messages = await MessagesModel.find({ collaborationId })
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 }) // Sort by newest messages first
            .populate({
                path: "creatorId",
                select: "full_name" // Only fetch name and email
            })
            .populate({
                path: "vendorId",
                select: "business_name" // Only fetch name and email
            });

        // Count total messages for this collaboration (useful for pagination)
        const total = await MessagesModel.countDocuments({ collaborationId });

        // Respond with messages and total count
        return res.status(200).json({
            data: messages,
            total,
            message: "Messages fetched successfully"
        });
    } catch (error) {
        console.log("Error fetching messages", error);

        // Return an error response if something goes wrong
        res.status(500).json({ message: "Error fetching messages", error });
    }
};


/**
 * Controller to save a new collaboration message.
 */
export const saveCollaborationMessage = async (body: { collaborationId: string, message: string, creatorId?: string, vendorId?: string }) => {
    try {
        // Extract message details from the request body
        const { collaborationId, message, creatorId, vendorId } = body;

        /**
         * Create a new message instance with the provided data:
         * - `collaborationId`: ID of the collaboration where the message belongs
         * - `message`: The actual text message
         * - `creatorId`: ID of the user who created the message
         * - `vendorId`: ID of the vendor involved in the collaboration
         * - `createdAt`: Timestamp when the message is created
         */
        const newMessage = new MessagesModel({
            collaborationId,
            creatorId,
            vendorId,
            messageJson: { message: message },
        });

        // Save the new message to the database
        await newMessage.save();

        // Populate creator and vendor information before returning
        const populatedMessage = await MessagesModel.findById(newMessage._id)
            .populate({
                path: "creatorId",
                select: "full_name"
            })
            .populate({
                path: "vendorId",
                select: "business_name"
            });

        // Respond with success message
        return populatedMessage;
    } catch (error) {
        console.log("Error saving message", error);
        return null;
    }
};

export const markMessagesAsRead = async (
  collaborationId: string,
  vendorId?: string,
  creatorId?: string
) => {
  await MessagesModel.updateMany(
    {
      collaborationId,
      ...(vendorId && { vendorId }),
      ...(creatorId && { creatorId })
    },
    { $set: { isRead: true } }
  );
};

export const markAllMessagesRead = async (collaborationId: string, type: string) => {
    await MessagesModel.updateMany(
        { collaborationId, ...(type === "vendor" ? { creatorId : {$exists: true} }: { vendorId : {$exists: true} }) },
        { $set: { isRead: true } }
    );
};
