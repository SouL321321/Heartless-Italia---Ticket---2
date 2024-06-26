const { EmbedBuilder } = require("discord.js");
const WelcomeEv = require("../../models/WelcomeEv");

module.exports = {
  async execute(guild, client) {
    try {
      const filter = { guildId: guild.id };
      const update = {
        guildId: guild.id,
        name: guild.name,
      };

      await WelcomeEv.findOneAndUpdate(filter, update, {
        upsert: true,
        new: true,
      });

      const embed = new EmbedBuilder()
        .setTitle(
          "Grazie per aver aggiunto " +
            client.user.username +
            " in " +
            guild.name +
            "✨❤"
        )
        .setDescription(
          "Sono qui per aiutare al meglio la gestione della moderazione, spero di non deludere.🐧✨⭐"
        )
        .setColor("LuminousVividPink")
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
          {
            name: "🚀 Per Iniziare",
            value: "Scrivi `/help` per vedere tutti i miei comandi.",
            inline: false,
          },
          {
            name: "📳 Moderazione",
            value: "Concentrati, modera, ma con divertimento e stile. 👀",
            inline: false,
          },
          {
            name: "🔧 Tools",
            value: "Usa `/server` per vedere una panoramica completa del server. 🎇",
            inline: false,
          }
        )
        .setFooter({ text: "Bisogno di aiuto? Sentiti libero di chiedere!" });

      const systemChannel = guild.systemChannel;
      if (systemChannel) {
        systemChannel.send({ embeds: [embed] }).catch(console.error);
      } else {
        console.log("Impossibile cercare un canale per inviare l'embed.");
      }
    } catch (error) {
      console.error("Errore aggiungendo il server al db:", error);
    }
  },
};
