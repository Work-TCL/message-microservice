import {
  BidModel,
  CollaborationModel,
  NotificationModel,
  ProductModel,
} from "../../database/model";
import { sendCollaborationNotification, sendNotification } from "../../socket";

export const addNewBid = async (body: any) => {
  try {
    const { collaborationId, proposal, type, sender } = body;

    const bid = new BidModel({
      proposal,
      type,
      sender,
    });
    const savedBid = await bid.save();

    // Update Collaboration: push bid, set negotiation object
    await CollaborationModel.findByIdAndUpdate(
      collaborationId,
      {
        $push: {
          bids: savedBid._id, // push single ID, not array
        },
        $set: {
          negotiation: {
            agreedByCreator: sender === "creator",
            agreedByVendor: sender === "vendor",
          },
        },
      },
      { new: true }
    );

    //send notification
    const product: any = await CollaborationModel.findById(collaborationId)
      .select("collaborationStatus") // Select only `status` field from Collaboration
      .populate({
        path: "productId",
        select: "title", // Only include the `name` field from Product
      })
      .populate({
        path: "creatorId",
        select: "user_name", // Only include `user_name` from Creator
      })
      .populate({
        path: "vendorId",
        select: "business_name", // Only include `business_name` from Vendor
      });

    // Create notification documents for each user
    if (sender === "creator") {
      await NotificationModel.create({
        userId: product?.vendorId?._id,
        message: `New bid from creator ${product?.creatorId?.user_name} for product ${product?.productId?.title}`,
        read: false,
        userType: "vendor",
        notificationType: "collaboration",
      });
      sendCollaborationNotification(
        [String(product?.vendorId?._id)], // force string
        {
          message: `New bid from creator ${product?.creatorId?.user_name} for product ${product?.productId?.title}`,
          notificationType: "collaboration",
          userType: "vendor",
          path: "/vendor/creators/collaboration/" + collaborationId
        }
      );
    } else {
      await NotificationModel.create({
        userId: product?.creatorId?._id,
        message: `New bid from vendor ${product?.vendorId?.business_name} for product ${product?.productId?.title}`,
        read: false,
        userType: "creator",
        notificationType: "collaboration",
      });
      
      sendCollaborationNotification(
        [String(product?.creatorId?._id)], // force string
        {
          message: `New bid from vendor ${product?.vendorId?.business_name} for product ${product?.productId?.title}`,
          notificationType: "collaboration",
          userType: "creator",
          path: "/creator/collaboration/" + collaborationId
        }
      );
    }
    return savedBid;
  } catch (e) {
    console.log("error while adding new bid", e);
    return false;
  }
};

export const markBidAsSeen = async (bidId: string, type: string) => {
  await BidModel.findOneAndUpdate(
    {
      _id: bidId,
      ...(type === "creator" ? { sender: "vendor" } : { sender: "creator" }),
    },
    { $set: { isSeen: true } }
  );
};

export const markAllBidsAsSeen = async (
  collaborationId: string,
  type: string
) => {
  const bids = await CollaborationModel.findById(collaborationId).select(
    "bids"
  );

  await BidModel.updateMany(
    {
      _id: { $in: bids?.bids },
      ...(type === "creator" ? { sender: "vendor" } : { sender: "creator" }),
    },
    { $set: { isSeen: true } }
  );
};
