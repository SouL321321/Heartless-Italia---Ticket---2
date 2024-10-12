const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  channelId: String,
  ticketId: String,
  createdAt: Date,
  claimed: Boolean,
  claimedBy: String,
  type: String,
  closedBy: String,
  closeReason: String,
});

module.exports = mongoose.model("ticket", ticketSchema);
