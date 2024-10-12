const mongoose = require("mongoose");

const ticketConfig = new mongoose.Schema({
  guildID: String,
  ticketOpenCatID: String,
  ticketClosedCatID: String,
  ticketTranscriptsID: String,
  ticketRoles: Array,
});

module.exports = mongoose.model("ticketConfig", ticketConfig);