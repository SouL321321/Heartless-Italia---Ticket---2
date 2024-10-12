const { ActivityType } = require("discord.js");

module.exports = (client) => {
    client.pickPresence = async () => {
        // const serverCount = client.guilds.cache.size;
        const options = [
            // {
            //     type: ActivityType.Listening,
            //     text: `⚠️ ᴍᴀɴᴜᴛᴇɴᴢɪᴏɴᴇ ⚠️`,
            //     status: "dnd",
            // },
            {
                type: ActivityType.Watching,
                text: `ʜᴇᴀʀᴛʟᴇꜱꜱ ɪᴛᴀʟɪᴀ - ᴛɪᴄᴋᴇᴛ`,
                status: "online",
            },
            // {
            //   type: ActivityType.Listening,
            //   text: "Do not disturb me🛑 ty",
            //   status: "dnd",
            // },
        ];

        const option = Math.floor(Math.random() * options.length);

        client.user.setPresence({
            activities: [
                {
                    name: options[option].text,
                    type: options[option].type,
                }],
            status: options[option].status,
        });
    };
};