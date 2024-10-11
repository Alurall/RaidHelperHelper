const { Client, GatewayIntentBits, ChannelType } = require("discord.js");
const { dungeons } = require("./dungeons.js").default;
require('log-timestamp');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent]
});

client.on("ready", () => {
    console.log(`${client.user.username} connected`);
});

client.on('threadCreate', async (thread) => {
    // Make sure it's only the forum id we want
    if (thread.type == ChannelType.PublicThread && thread.parentId == process.env.FORUM_ID) {
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
                advancedSettings: {
                    image: dungeon ? dungeon.banner : "",
                    alt_names: true,
                    show_info: false
                }
            })
        });
        const data = await response.json();
        console.log(`Created event >${data.event.title}< by ${data.event.leaderName}`);
    }
})

client.login(process.env.DISCORD_TOKEN);
