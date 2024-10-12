const { Client, GatewayIntentBits, ChannelType } = require("discord.js");
const { dungeons } = require("./dungeons.js").default;
require('log-timestamp');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent]
});

client.on("ready", () => {
    console.log(`${client.user.username} connected`);
});

client.on("messageCreate", async (message) => {
    if (message.channel.parentId == process.env.FORUM_ID && message.channel.messageCount == 1) {
        let thread = message.channel;
        // Try to get the Dungeon banner based on the thread name
        const dungeon = Object.values(dungeons).find(d =>
            d.alias.some(alias => thread.name.toLowerCase().includes(alias.toLowerCase()))
        );
        // Call raid helper api to create a new event
        const url = `https://raid-helper.dev/api/v2/servers/${thread.guildId}/channels/${thread.id}/event`
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': process.env.RAIDHELPER_TOKEN,
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify({
                leaderId: thread.ownerId,
                templateId: 2, // wow classic
                title: thread.name,
                description: message.content,
                advancedSettings: {
                    image: dungeon ? dungeon.banner : "",
                    alt_names: true,
                    show_info: false
                }
            })
        });
        const data = await response.json();
        console.log(data); // debug
        console.log(`Created event >${data.event.title}< by ${data.event.leaderName}`);
    }
});

client.login(process.env.DISCORD_TOKEN);
