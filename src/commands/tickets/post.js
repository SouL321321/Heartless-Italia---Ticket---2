const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const schemaTicketConfig = require("../../models/ticketConfig");
const authorizedUsers = process.env.OWNERS_BOT.split(",");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("post-ticket")
    .setDescription("Posta un Ticket")
    .addStringOption((option) =>
      option
        .setName("titolo")
        .setDescription("Titolo del Ticket")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("canale")
        .setDescription("Canale dove postare il ticket")
        .setRequired(true)
    ),
  async execute(interaction) {
    if (!authorizedUsers.includes(interaction.user.id)) {
      await interaction.reply({
        content: "Mi spiace, questo setup / comando è riservato solo agli Owners! 👑",
        ephemeral: true,
      });
      return;
    }

    // Defer the reply to avoid timeout issues
    await interaction.deferReply({ ephemeral: true });

    const config = await schemaTicketConfig.findOne({
      guildID: interaction.guild.id,
    });

    if (!config) {
      await interaction.editReply({
        content: "Il sistema di ticket non è stato configurato in questo server. Usa `/ticket-config` per configurarlo prima.",
      });
      return;
    }

    const title = interaction.options.getString("titolo") || "Ticket";
    const channel =
      interaction.options.getChannel("canale") || interaction.channel;

    const whiteArrow = "<:HI_zMod:1284878617498878063>"; // Sostituisci con l'ID dell'emoji personalizzata

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(
        ` ${whiteArrow} Apri un **__ticket SUPPORTO__** per richiedere __supporto generale allo Staff__ \n\n` +
          ` ${whiteArrow} Apri un **__ticket HIGH STAFF__** per richiedere __supporto da un High Staffer__ \n\n` +
          ` ${whiteArrow} Apri un **__ticket PARTNER__** per richiedere __partnership con il server__ \n`
      )
      .setColor("DarkBlue");

    const button = new ButtonBuilder()
      .setCustomId("ticket")
      .setEmoji("1284513846618230806") // Assicurati che questo ID emoji sia corretto
      .setLabel("Ticket")
      .setStyle(ButtonStyle.Primary);

    const actionRow = new ActionRowBuilder().addComponents(button);

    await channel.send({ embeds: [embed], components: [actionRow] });

    // Send the confirmation reply after the embed has been sent
    await interaction.editReply({ content: "Ticket postato!" });
  },
};