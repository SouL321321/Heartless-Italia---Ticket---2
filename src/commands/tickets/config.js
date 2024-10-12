const {
  SlashCommandBuilder,
  PermissionsBitField,
  ChannelType,
} = require("discord.js");
const schemaTicketConfig = require("../../models/ticketConfig");
const authorizedUsers = process.env.OWNERS_BOT.split(",");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-config")
    .setDescription("Configura il sistema Ticket")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("categoria")
        .setDescription("Setta la categoria per il Ticket")
        .addChannelOption((option) =>
          option
            .setName("apri-categoria")
            .setDescription("La categoria dove il ticket aperto verrà creato.")
            .setRequired(true)
        )
        .addChannelOption((option) =>
          option
            .setName("channel-transcript")
            .setDescription("Il canale dove il transcript verrà inviato.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ruolo")
        .setDescription("Setta il ruolo per i Ticket")
        .addRoleOption((option) =>
          option
            .setName("role-support-obbligatorio")
            .setDescription("Il ruolo obbligatorio per la gestione dei Ticket")
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName("role-support-opzionale-1")
            .setDescription("Primo ruolo opzionale")
            .setRequired(false)
        )
        .addRoleOption((option) =>
          option
            .setName("role-support-opzionale-2")
            .setDescription("Secondo ruolo opzionale")
            .setRequired(false)
        )
        .addRoleOption((option) =>
          option
            .setName("role-support-opzionale-3")
            .setDescription("Terzo ruolo opzionale")
            .setRequired(false)
        )
    ),

  async execute(interaction) {
    if (!authorizedUsers.includes(interaction.user.id)) {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.reply({
          content:
            "Mi spiace, questo setup / comando è riservato solo agli Owners! 👑",
          ephemeral: true,
        });
      }
      return;
    }

    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ManageChannels
      )
    ) {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.reply({
          content: "Hai bisogno dei permessi adatti per gestire i Ticket.",
          ephemeral: true,
        });
      }
      return;
    }

    await interaction.deferReply({ ephemeral: true });
    const subcommand = interaction.options.getSubcommand();
    let config = await schemaTicketConfig.findOne({
      guildID: interaction.guild.id,
    });

    // Initialize configuration if not found
    if (!config) {
      config = new schemaTicketConfig({ guildID: interaction.guild.id });
    }

    // Check if configuration already exists
    if (
      subcommand === "categoria" &&
      config.ticketOpenCatID &&
      config.ticketTranscriptsID
    ) {
      return interaction.editReply({
        content: "La configurazione della categoria è già completa.",
      });
    }

    if (subcommand === "ruolo" && config.ticketRoles.length > 0) {
      return interaction.editReply({
        content: "La configurazione dei ruoli è già completa.",
      });
    }

    // Proceed with the configuration updates
    switch (subcommand) {
      case "categoria":
        const categoryOpen = interaction.options.getChannel("apri-categoria");
        const categoryOverflow =
          interaction.options.getChannel("channel-transcript");

        if (categoryOpen.type !== ChannelType.GuildCategory) {
          return interaction.editReply({
            content: "Il canale 'apri-categoria' deve essere una categoria.",
          });
        }
        if (categoryOverflow.type !== ChannelType.GuildText) {
          return interaction.editReply({
            content:
              "Il canale 'channel-transcript' deve essere un canale testuale.",
          });
        }

        config.ticketOpenCatID = categoryOpen.id;
        config.ticketTranscriptsID = categoryOverflow.id;

        await config.save();

        return interaction.editReply({
          content: `Le categorie sono state settate correttamente: \n- Categoria Aperta: ${categoryOpen.name} \n- Canale Transcript: ${categoryOverflow.name}`,
        });

      case "ruolo":
        const roleSupportObbligatorio = interaction.options.getRole(
          "role-support-obbligatorio"
        );
        const roleSupportOpzionale1 = interaction.options.getRole(
          "role-support-opzionale-1"
        );
        const roleSupportOpzionale2 = interaction.options.getRole(
          "role-support-opzionale-2"
        );
        const roleSupportOpzionale3 = interaction.options.getRole(
          "role-support-opzionale-3"
        );

        const roleIds = [roleSupportObbligatorio.id];

        if (roleSupportOpzionale1) roleIds.push(roleSupportOpzionale1.id);
        if (roleSupportOpzionale2) roleIds.push(roleSupportOpzionale2.id);
        if (roleSupportOpzionale3) roleIds.push(roleSupportOpzionale3.id);

        config.ticketRoles = roleIds;

        await config.save();

        return interaction.editReply({
          content:
            `Il ruolo obbligatorio è stato settato correttamente: ${roleSupportObbligatorio.name}\n` +
            `${
              roleSupportOpzionale1
                ? `Ruolo opzionale 1: ${roleSupportOpzionale1.name}\n`
                : ""
            }` +
            `${
              roleSupportOpzionale2
                ? `Ruolo opzionale 2: ${roleSupportOpzionale2.name}\n`
                : ""
            }` +
            `${
              roleSupportOpzionale3
                ? `Ruolo opzionale 3: ${roleSupportOpzionale3.name}`
                : ""
            }`,
        });

      default:
        if (!interaction.deferred && !interaction.replied) {
          await interaction.reply({
            content: "Devi specificare un subcomando valido.",
            ephemeral: true,
          });
        }
        break;
    }
  },
};
