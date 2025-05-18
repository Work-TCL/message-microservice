import mongoose from "mongoose";
import CreatorSchema from "../../../../shared-models/src/models/creator";
import VendorSchema from "../../../../shared-models/src/models/vendor";
import MessagesSchema from "../../../../shared-models/src/models/messages";
import NotificationSchema from "../../../../shared-models/src/models/notification";
import AccountSchema from "../../../../shared-models/src/models/account";
import { biddingSchema } from "../../../../shared-models/src/models/collaboration";
import CollaborationSchema from "../../../../shared-models/src/models/collaboration";

const AccountModel = mongoose.model("Account", AccountSchema);
const VendorModel = mongoose.model("Vendor", VendorSchema);
const CreatorModel = mongoose.model("Creator", CreatorSchema);
const MessagesModel = mongoose.model("Messages", MessagesSchema);
const NotificationModel = mongoose.model("Notification", NotificationSchema);
const CollaborationModel = mongoose.model("Collaboration", CollaborationSchema);
const BidModel = mongoose.model("Bid", biddingSchema);


export { AccountModel, VendorModel, CreatorModel, MessagesModel, NotificationModel ,CollaborationModel, BidModel};