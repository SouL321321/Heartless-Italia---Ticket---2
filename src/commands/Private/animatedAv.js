const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const authorizedUsers = process.env.OWNERS_BOT.split(",");

module.exports = {
    countdown: true,
    data: new SlashCommandBuilder()
        .setName("avatar_animato")
        .setDescription(
            "Anima l'avatar del tuo bot🪐 [⚠️ Solo gli owner/developer del bot possono usare questo comando. ⚠️]"
        )
        .addAttachmentOption((option) =>
            option
                .setName("avatar")
                .setDescription("Scegli la gif!")
                .setRequired(true)
        ),

    async execute(interaction, client) {
        try {
            if (!authorizedUsers.includes(interaction.user.id)) {
                await interaction.reply({
                    content: "Non hai i permessi per usare questo comando.",
                    ephemeral: true,
                });
                return;
            }

            await interaction.deferReply({ ephemeral: true });

            const { options } = interaction;
            const avatar = options.getAttachment("avatar");

            async function sendMessage(message) {
                const embed = new EmbedBuilder()
                    .setColor("Blurple")
                    .setDescription(message);

                await interaction.editReply({ embeds: [embed] });
            }

            if (!avatar.contentType || !avatar.contentType.includes("gif")) {
                await sendMessage(`⚠️ Per favore usa un formato GIF per animare l'avatar. ⚠️`);
                return;
            }

            var error;
            await client.user.setAvatar(avatar.url).catch(async (err) => {
                error = true;
                console.log(err);
                await sendMessage(`⚠️ Errore: \`${err.toString()}\``);
            });

            if (!error) {
                await sendMessage(`🌎 Ho aggiornato la mia pfp. ✨`);
            }
        } catch (error) {
            console.error("Errore durante l'esecuzione del comando:", error);
            interaction.followUp({
                content: "Errore durante l'esecuzione del comando.",
                ephemeral: true,
            });
        }
    },
};

if (authorizedUsers.includes(process.env.CLIENT_ID)) {
    client.application.commands.create(module.exports.data);
}