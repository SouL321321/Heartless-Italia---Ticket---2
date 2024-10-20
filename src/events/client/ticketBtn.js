const {
  Events,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const ticketSchema = require("../../models/Ticket");
const configSchema = require("../../models/ticketConfig");

const express = require("express");
const app = express();
const PORT = 3000;
const fs = require("fs");
const path = require("path");

app.get("/ticket/:channelId", async (req, res) => {
  const channelId = req.params.channelId;
  const transcriptFilePath = path.join(
    __dirname,
    "transcripts",
    `transcript_${channelId}.html`
  );

  console.log(`Sending transcript for channel ${channelId}`);

  try {
    if (!fs.existsSync(transcriptFilePath)) {
      res.status(404).send("Transcript not found.");
      return;
    }

    res.sendFile(transcriptFilePath);
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).send("Internal server error.");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction) {
    try {
      if (interaction.isButton() && interaction.customId === "ticket") {
        const config = await configSchema.findOne({
          guildID: interaction.guild.id,
        });
        if (!config)
          return interaction.reply({
            content: "Configurazione non trovata!",
            ephemeral: true,
          });

        const existingTicket = await ticketSchema.findOne({
          guildId: interaction.guild.id,
          userId: interaction.user.id,
          claimed: false,
        });
        if (existingTicket)
          return interaction.reply({
            content: "Hai già un Ticket aperto! 🚫",
            ephemeral: true,
          });

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("ticketType")
          .setPlaceholder("Seleziona il tipo di aiuto che necessiti:")
          .addOptions([
            { label: "🎫 Supporto", value: "Supporto" },
            { label: "⚕️ High Staff", value: "High Staff" },
            { label: "📰 Partnership", value: "Partnership" },
            { label: "🔨 Report", value: "Report" },
            { label: "⚙️ Altro", value: "Altro" },
          ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        return interaction.reply({
          content: "Per favore scegli il tipo di aiuto:",
          components: [row],
          ephemeral: true,
        });
      } else if (
        interaction.isButton() &&
        interaction.customId.startsWith("claimTicket")
      ) {
        await handleClaim(interaction);
      } else if (
        interaction.isButton() &&
        interaction.customId.startsWith("closeTicket")
      ) {
        await handleClose(interaction);
      }

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId === "ticketType"
      ) {
        if (interaction.values[0] === "Altro") {
          const modal = modalBuilder("Altro Ticket 🚫", "otherTicketModal", [
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("otherTicketInput")
                .setLabel("Descrivi il tuo problema o richiesta.")
                .setStyle(TextInputStyle.Paragraph)
            ),
          ]);
          return interaction.showModal(modal);
        } else {
          await createTicket(interaction, interaction.values[0]);
        }
      }

      if (
        interaction.isModalSubmit() &&
        interaction.customId === "otherTicketModal"
      ) {
        const userInput =
          interaction.fields.getTextInputValue("otherTicketInput");
        await createTicket(interaction, "Altro", userInput);
      }
    } catch (err) {
      console.error("Error handling interaction:", err);
    }
  },
};

async function createTicket(interaction, type, details = "") {
  await interaction.deferReply({ ephemeral: true });
  const config = await configSchema.findOne({ guildID: interaction.guild.id });
  const ticketId = interaction.user.username;

  let roleToTag;
  switch (type) {
    case "Supporto":
      roleToTag = "1284279005905948673";
      break;
    case "High Staff":
      roleToTag = "1284278952524906618";
      break;
    case "Partnership":
      roleToTag = "1284309094727024762";
      break;
    case "Report":
      roleToTag = "1284279005905948673";
      break;
    case "Altro":
      roleToTag = "1284279005905948673";
      break;
    default:
      roleToTag = null;
      break;
  }

  const ticketChannel = await interaction.guild.channels.create({
    name: `ticket-${ticketId}`,
    type: ChannelType.GuildText,
    parent: config.ticketOpenCatID,
    permissionOverwrites: [
      {
        id: interaction.guild.roles.everyone,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.AttachFiles,
        ],
      },
      {
        id: roleToTag,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.AttachFiles,
        ],
      },
    ],
  });

  const ticket = new ticketSchema({
    guildId: interaction.guild.id,
    userId: interaction.user.id,
    channelId: ticketChannel.id,
    ticketId: ticketId,
    createdAt: new Date(),
    claimed: false,
    claimedBy: null,
    type: type,
  });

  await ticket.save();

  const ticketEmoji = "<:HI_fsupport:1284513846618230806>";
  const starTicket = "<:HI_YellowStar:1284563159251685417>";
  const chatTicket = "<:HI_fchat:1284513581257461870>";

  let description;
  switch (type) {
    case "Supporto":
      description = `\n\n ${ticketEmoji} ・ \`\ 𝐓𝐈𝐂𝐊𝐄𝐓 𝐒𝐔𝐏𝐏𝐎𝐑𝐓𝐎 \`\n${starTicket} ➜ Attendi un <@&${roleToTag}> che ti risponderà al più presto\n\n${chatTicket} ➥ Nel frattempo, esponi il tuo problema. `;
      break;
    case "High Staff":
      description = `\n\n ${ticketEmoji} ・ \`\ 𝐓𝐈𝐂𝐊𝐄𝐓 𝐇𝐈𝐆𝐇 𝐒𝐓𝐀𝐅𝐅 \`\n${starTicket} ➜ Attendi un <@&${roleToTag}> che ti risponderà al più presto\n\n${chatTicket} ➥ Nel frattempo, esponi il tuo problema. `;
      break;
    case "Partnership":
      description = `\n\n ${ticketEmoji} ・ \`\ 𝗧𝗜𝗖𝗞𝗘𝗧 𝗣𝗔𝗥𝗧𝗡𝗘𝗥𝗦𝗛𝗜𝗣 \`\n${starTicket} ➜ Attendi un <@&${roleToTag}> che ti risponderà al più presto\n\n${chatTicket} ➥ Nel frattempo, esponi il tuo problema. `;
      break;
    case "Report":
      description = `\n\n ${ticketEmoji} ・ \`\ 𝐓𝐈𝐂𝐊𝐄𝐓 𝐑𝐄𝐏𝐎𝐑𝐓\`\n${starTicket} ➜ Attendi un <@&${roleToTag}> che ti risponderà al più presto\n\n${chatTicket} ➥ Nel frattempo, esponi il tuo problema. `;
      break;
    case "Altro":
      description = `\n\nHai aperto un ticket ||in formato Modal|| con i seguenti dettagli: ${details}`;
      break;
    default:
      description = "\n\nTipo di ticket sconosciuto.";
  }

  const embed = new EmbedBuilder()
    .setTitle("⤵")
    .setDescription(description)
    .setColor("Green")
    .setTimestamp();

  const buttonRows = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`claimTicket-${ticketId}`)
      .setLabel("🙋‍♂️ Rivendica")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`closeTicket-${ticketId}-${ticketChannel.id}`)
      .setLabel("🔐 Chiudi")
      .setStyle(ButtonStyle.Danger)
  );

  await ticketChannel.send({
    embeds: [embed],
    components: [buttonRows],
    allowedMentions: {
      parse: ["roles"],
      roles: [roleToTag],
    },
  });

  await ticketChannel.send(`<@&${roleToTag}>`);

  interaction.editReply({
    content: `Il tuo Ticket è stato creato: ${ticketChannel}`,
    ephemeral: true,
  });
}

function modalBuilder(title, id, components) {
  return new ModalBuilder()
    .setTitle(title)
    .setCustomId(id)
    .setComponents(components);
}

async function handleClaim(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const ticketId = interaction.customId.split("-")[1];
  const ticket = await ticketSchema.findOne({
    guildId: interaction.guild.id,
    ticketId: ticketId,
    claimed: false,
  });

  if (!ticket) {
    return interaction.followUp({
      content: "Ticket già rivendicato o non trovato! 🙅‍♂️",
      ephemeral: true,
    });
  }

  if (ticket.userId === interaction.user.id) {
    return interaction.followUp({
      content: "Non puoi rivendicare un ticket che hai aperto tu! 🚫",
      ephemeral: true,
    });
  }

  let roleToTag;
  switch (ticket.type) {
    case "Supporto":
      roleToTag = "1284279005905948673";
      break;
    case "High Staff":
      roleToTag = "1284278952524906618";
      break;
    case "Partnership":
      roleToTag = "1284309094727024762";
      break;
    case "Report":
      roleToTag = "1284279005905948673";
      break;
    case "Altro":
      roleToTag = "1284279005905948673";
      break;
    default:
      roleToTag = null;
      break;
  }

  if (!interaction.member.roles.cache.has(roleToTag)) {
    return interaction.followUp({
      content: "Non hai il permesso per rivendicare questo tipo di ticket! 🙅‍♂️",
      ephemeral: true,
    });
  }

  ticket.claimedBy = interaction.user.id;
  ticket.claimed = true;
  await ticket.save();

  await interaction.channel.permissionOverwrites.set([
    {
      id: interaction.guild.roles.everyone,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
      ],
    },
    {
      id: ticket.userId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
      ],
    },
  ]);

  const claimEmbed = new EmbedBuilder()
    .setTitle("Ticket Rivendicato")
    .setDescription(`Il Ticket è stato rivendicato da ${interaction.user}`)
    .setColor("Green");

  await interaction.channel.send({ embeds: [claimEmbed] });
  interaction.editReply({
    content: "Ticket rivendicato con successo! ✅",
    ephemeral: true,
  });
}

async function handleClose(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const ticketId = interaction.customId.split("-")[1];
  const ticket = await ticketSchema.findOne({
    guildId: interaction.guild.id,
    ticketId: ticketId,
  });
  const config = await configSchema.findOne({ guildID: interaction.guild.id });

  if (!ticket) {
    return interaction.editReply({
      content: "Ticket non trovato! 📩",
      ephemeral: true,
    });
  }

  if (ticket.userId === interaction.user.id) {
    return interaction.editReply({
      content: "Non puoi chiudere un ticket che hai aperto tu! 🚫",
      ephemeral: true,
    });
  }

  let roleToTag;
  switch (ticket.type) {
    case "Supporto":
      roleToTag = "1284279005905948673";
      break;
    case "High Staff":
      roleToTag = "1284278952524906618";
      break;
    case "Partnership":
      roleToTag = "1284309094727024762";
      break;
    case "Report":
      roleToTag = "1284279005905948673";
      break;
    case "Altro":
      roleToTag = "1284279005905948673";
      break;
    default:
      roleToTag = null;
      break;
  }

  if (!interaction.member.roles.cache.has(roleToTag)) {
    return interaction.editReply({
      content: "Non hai il permesso per chiudere questo tipo di ticket! 🙅‍♂️",
      ephemeral: true,
    });
  }

  const ticketChannel = interaction.guild.channels.cache.get(ticket.channelId);
  if (!ticketChannel) {
    return interaction.editReply({
      content: "Canale Ticket non trovato! 🔍",
      ephemeral: true,
    });
  }

  const confirmRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`confirmCloseTicket-${ticketId}`)
      .setEmoji("1284856128617971796")
      .setLabel("Conferma")
      .setStyle("4")
  );

  await interaction.editReply({
    content: "Sei sicuro/a di voler chiudere il Ticket? 🚨",
    components: [confirmRow],
    ephemeral: true,
  });

  const filter = (i) =>
    i.customId === `confirmCloseTicket-${ticketId}` &&
    i.user.id === interaction.user.id;
  const collector = interaction.channel.createMessageComponentCollector({
    filter,
    time: 15000,
  });

  collector.on("collect", async (i) => {
    if (i.customId === `confirmCloseTicket-${ticketId}`) {
      await interaction.followUp({
        content: "Ticket chiuso con successo! 🔐",
        ephemeral: true,
      });

      const closeEmbed = new EmbedBuilder()
        .setTitle("Ticket Chiuso")
        .setDescription(
          `Il Ticket è stato chiuso da ${interaction.user}, e sarà rimosso in 5 secondi. Se hai ulteriori problemi, puoi aprire un altro Ticket ||Usali con cautela e responsabilità, verrai penalizzato se dovessi aprire Ticket inutili.||`
        )
        .setColor("Red");

      if (ticketChannel) {
        await ticketChannel.send({ embeds: [closeEmbed] });

        await new Promise((resolve) => setTimeout(resolve, 5000));

        await ticketChannel.permissionOverwrites.edit(
          interaction.guild.roles.everyone,
          { deny: [PermissionFlagsBits.ViewChannel] }
        );

        await ticketChannel.edit({
          name: `closed-${ticketId}`,
          parent: config.ticketClosedCatID,
        });

        try {
          await ticketChannel.delete();
        } catch (error) {
          console.error("Errore durante l'eliminazione del canale:", error);
        }
      }

      const transEmbed = new EmbedBuilder()
        .setTitle("📝 **Ticket Transcript**")
        .setDescription(
          `Questo è il transcript del Ticket #${ticketId}. \n\n` +
            `**📜 Dettagli del Ticket:**\n\n` +
            `**👤 Creato da:** <@${ticket.userId}>\n` +
            `**🕵️‍♂️ Rivendicato da:** ${
              ticket.claimedBy ? `<@${ticket.claimedBy}>` : "Nessuno"
            }\n` +
            `**📅 Creato il:** ${ticket.createdAt.toLocaleString()}\n` +
            `**🔢 Tipo di Ticket:** ${ticket.type}`
        )
        .setColor("Green")
        .setTimestamp();

      const viewTransRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("🔍 Vedi Transcript")
          .setStyle(ButtonStyle.Link)
          .setURL(
            `http://localhost:3000/ticket/${ticket.channelId}`
          )
      );

      const channel = interaction.guild.channels.cache.get(
        config.ticketTranscriptsID
      );

      if (channel) {
        await channel.send({
          embeds: [transEmbed],
          components: [viewTransRow],
        });
      }

      await ticketSchema.deleteOne({
        guildId: interaction.guild.id,
        ticketId: ticketId,
      });
    }
  });
}