const { REST, Routes, Collection } = require("discord.js");
const fs = require("fs");

module.exports = (client) => {
    client.handleCommands = async () => {
        const commandFolders = fs.readdirSync(`./src/commands`);
        client.commands = new Collection();
        client.commandArray = [];
        for (const folder of commandFolders) {
            const commandFiles = fs
                .readdirSync(`./src/commands/${folder}`)
                .filter((file) => file.endsWith(".js"));
            for (const file of commandFiles) {
                const command = require(`../../commands/${folder}/${file}`);
                if (command.data && command.data.name) {
                    client.commands.set(command.data.name, command);
                    client.commandArray.push(command.data);
                } else {
                    console.error(
                        `Il comando nel file ${file} mancano le proprietà richieste.`
                    );
                }
            }
        }

        const clientId = process.env.CLIENT_ID;
        const rest = new REST({ version: 10 }).setToken(process.env.TOKEN);

        try {
            console.log("Avviato l'aggiornamento dei comandi (/) dell'applicazione..");
            await rest.put(Routes.applicationCommands(clientId), {
                body: client.commandArray,
            });
            console.log("Comandi dell'applicazione (/) ricaricati correttamente.");
        } catch (error) {
            console.error(`Errore durante il caricamento dei comandi: ${error.message}`);
        }

        console.log(
            `Comandi dell'applicazione ${client.commandArray.length} (/) ricaricati correttamente.`
        );
    };
};