module.exports = {
    name: "ready",
    once: true,
    async execute(client) {
      setInterval(client.pickPresence, 6000);
      console.log(`Pronti! 🍀 ${client.user.tag} è loggato ed è online!✅`);
    },
  };