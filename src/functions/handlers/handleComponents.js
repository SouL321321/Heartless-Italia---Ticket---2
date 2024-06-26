const { readdirSync } = require("fs");

module.exports = (client) => {
    client.selectMenus = new Map();
    client.buttons = new Map();
    client.handleComponents = async () => {
        const componentFolders = readdirSync("./src/components");
        for (const folder of componentFolders) {
            const componentFiles = readdirSync(`./src/components/${folder}`).filter(
                (file) => file.endsWith(".js")
            );

            const { buttons, selectMenus } = client;

            switch (folder) {
                case "buttons":
                    for (const file of componentFiles) {
                        try {
                            const button = require(`../../components/${folder}/${file}`);
                            if (button.customId) {
                                buttons.set(button.customId, button);
                            } else if (button.data && button.data.name) {
                                buttons.set(button.data.name, button);
                            } else {
                                console.error(`Le componenti in ${folder}/${file} non hanno un customId o nome.`);
                            }
                        } catch (error) {
                            console.error(`Errore durante il caricamento dei bottoni: ${folder}/${file}:`, error);
                        }
                    }
                    break;

                case "selectMenus":
                    for (const file of componentFiles) {
                        try {
                            const menu = require(`../../components/${folder}/${file}`);
                            if (menu.customId) {
                                selectMenus.set(menu.customId, menu);
                            } else if (menu.data && menu.data.name) {
                                selectMenus.set(menu.data.name, menu);
                            } else {
                                console.error(`Le componenti in ${folder}/${file} non hanno un customId o nome.`);
                            }
                        } catch (error) {
                            console.error(`Errore durante il caricamento del componente selectMenu ${folder}/${file}:`, error);
                        }
                    }
                    break;

                default:
                    break;
            }
        }
    };
};