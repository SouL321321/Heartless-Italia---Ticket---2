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
          "Sono qui per aiutare al meglio per la _gestione_ dei *ticket*, spero di non deludervi.🐧✨⭐"
        )
        .setColor("LuminousVividPink")
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
          {
            name: "🎫 Supporto",
            value: "Se hai bisogno di `Supporto`.",
            inline: false,
          },
          {
            name: "⚕️ High Staff",
            value: "Se hai bisogno degli **High Staffers**.",
            inline: false,
          },
          {
            name: "📰 Partnership",
            value: "Sei qui per fare `partnership?` ",
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
