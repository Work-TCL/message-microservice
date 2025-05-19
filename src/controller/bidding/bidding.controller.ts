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

    await CollaborationModel.findByIdAndUpdate(collaborationId, {
      $push: {
        bids: savedBid._id,
        negotiation:{
          agreedByCreator: type === "creator" ? true : false,
          agreedByVendor: type === "vendor" ? true : false,
        },
      },
    });

    return savedBid;
  } catch (e) {
    console.log("error while adding new bid", e);
    return false;
  }
};
