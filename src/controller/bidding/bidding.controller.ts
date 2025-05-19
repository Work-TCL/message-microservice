import { BidModel, CollaborationModel } from "../../database/model";

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

    return savedBid;
  } catch (e) {
    console.log("error while adding new bid", e);
    return false;
  }
};
