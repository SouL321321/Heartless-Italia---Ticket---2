require("dotenv").config();
const { Client, IntentsBitField, Partials } = require("discord.js");
const fs = require("fs");
const mongoose = require("mongoose");
const welcomeEvent = require("./events/client/welcomeEvents");

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMessageTyping,
    IntentsBitField.Flags.GuildIntegrations,
    IntentsBitField.Flags.GuildInvites,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.AutoModerationExecution,
    IntentsBitField.Flags.GuildModeration,
    IntentsBitField.Flags.AutoModerationConfiguration,
    IntentsBitField.Flags.GuildEmojisAndStickers
  ],
  partials: [Partials.Channel],
  debug: true,
});

mongoose.connect(process.env.MONGO_URL, {});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", () => {
  console.log("Connesso al database! 💻");
});

const functionFolders = fs.readdirSync(`./src/functions`);
for (const folder of functionFolders) {
  const functionFiles = fs
    .readdirSync(`./src/functions/${folder}`)
    .filter((file) => file.endsWith(".js"));
  for (const file of functionFiles) {
    require(`./functions/${folder}/${file}`)(client);
  }
}

client.handleEvents();
client.handleComponents();
client.handleCommands();

client.on(welcomeEvent.name, (...args) => welcomeEvent.execute(...args));

client.on("guildCreate", (guild) => {
  const welcomeEvent = require("./events/client/welcomeEvents");
  welcomeEvent.execute(guild, client);
});


client.login(process.env.TOKEN);