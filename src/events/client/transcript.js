const discordTranscripts = require("discord-html-transcripts");
const { Events } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction) {
    if (
      interaction.isButton() &&
      interaction.customId.startsWith("closeTicket")
    ) {
      `Chiudendo il Ticket ${interaction.customId.split("-")}`;

      await makeTransFile(interaction.customId.split("-")[2], interaction);
    }
  },
};

async function makeTransFile(channelId, i) {
  const channel = i.guild.channels.cache.get(channelId);
  `Creando il Transcript per il canale ${channelId}`;
  const trans = await discordTranscripts.createTranscript(channel);

  const transcriptsDir = path.join(__dirname, "transcripts");
  const publicDir = path.join(__dirname, "public");

  if (!fs.existsSync(transcriptsDir)) {
    fs.mkdirSync(transcriptsDir);
  }

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  const transcriptFilePath = path.join(
    transcriptsDir,
    `transcript_${channelId}.html`
  );
  fs.writeFileSync(transcriptFilePath, trans.attachment.toString());
  `Transcript per il canale ${channelId} creato.`;

  const publicTranscriptPath = path.join(
    publicDir,
    `transcript_${channelId}.html`
  );
  fs.copyFileSync(transcriptFilePath, publicTranscriptPath);

  exec(
    `git -C ${__dirname} add transcripts/ && git -C ${__dirname} commit -m "Aggiornamento dei transcript" && git -C ${__dirname} push`,
    (err, stdout, stderr) => {
      if (err) {
        console.error(`Errore durante il push: ${stderr}`);
        return;
      }
      console.log(`Successo: ${stdout}`);
    }
  );
}
