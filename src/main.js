require('log-timestamp');
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { setTimeout } = require('timers/promises');
const { dungeons } = require("./dungeons.js").default;
const { newEvent, getEvent, updateEvent } = require("./raidhelperApi.js").default;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.GuildMember,
        Partials.ThreadMember
    ]
});

client.on("ready", () => {
    console.log(`${client.user.username} connected`);
});

async function getPartial(msg) {
    if (msg.partial) {
        //console.log("is partial")
        return await msg.fetch()
            .catch(error => {
                console.log('Something went wrong when fetching the message: ', error);
            });
    } else {
        return msg;
    }
}

client.on('threadCreate', async (thread) => {
    // Make sure it's only the forum id we want
    thread = await getPartial(thread);
    if (thread.parentId == process.env.FORUM_ID) {
        console.log("New Thread -> ", thread.name);
    }
})

var eventList = {};

function getDungeon(name) {
    return Object.values(dungeons).find(d =>
        d.alias.some(alias => name.toLowerCase().includes(alias.toLowerCase()))
    );
}

client.on("messageCreate", async (message) => {
    message = await getPartial(message);
    if (message.channel.parentId == process.env.FORUM_ID && message.channel.messageCount == 1) {
        //console.log("message -> ", message);
        let thread = message.channel;
        // Try to get the Dungeon banner based on the thread name
        const dungeon = getDungeon(thread.name);
        // Call raid helper api to create a new event and wait for the thread to exist
        await setTimeout(3000);
        const data = await newEvent(message, process.env.RAIDHELPER_TOKEN, dungeon)

        //console.log("api -> ", data); // debug
        console.log(`Created event >${data.event.title}< by ${data.event.leaderName}`);
        eventList[thread.id] = data.event.id;
    }
});

async function getEventId(channelId, guildId) {
    // check if we seen the event before
    if (eventList[channelId])
        return eventList[channelId];

    // otherwise fetch it from the API
    const eventId = await getEvent(channelId, process.env.RAIDHELPER_TOKEN, guildId);
    if (eventId) {
        eventList[channelId] = eventId;
        return eventId;
    }
}

client.on('messageUpdate', async (oldMessage, newMessage) => {
    newMessage = await getPartial(newMessage);
    oldMessage = await getPartial(oldMessage);
    if (!newMessage || !oldMessage || newMessage.author.id === client.user.id || newMessage.channel.parentId != process.env.FORUM_ID) return;

    // get first message
    const messages = await newMessage.channel.messages.fetch({ limit: 1, after: 0 });
    const firstMessage = messages.first();

    if (firstMessage.id != newMessage.id) return;

    let channel = newMessage.channel;
    const eventId = await getEventId(channel.id, channel.guild.id);

    if (eventId) {
        const data = await updateEvent(eventId, process.env.RAIDHELPER_TOKEN, { description: newMessage.content });
        console.log(data.status);
        console.log(`Description: >${data.event.title}< ${oldMessage.content} -> ${data.event.description}`);
    }
});

client.on('threadUpdate', async (oldThread, newThread) => {
    newThread = await getPartial(newThread);
    oldThread = await getPartial(oldThread);
    if (!newThread || !oldThread || newThread.parentId != process.env.FORUM_ID || oldThread.name == newThread.name) return;

    const eventId = await getEventId(newThread.id, newThread.guild.id);

    // only if new name
    if (eventId) {
        const dungeon = getDungeon(newThread.name);
        const data = await updateEvent(
            eventId,
            process.env.RAIDHELPER_TOKEN,
            {
                title: newThread.name,
                advancedSettings: { image: dungeon ? dungeon.banner : "" }
            }
        );
        console.log(data.status);
        console.log(`Title: ${oldThread.name} -> ${data.event.title}`);
    }
});

client.login(process.env.DISCORD_TOKEN);
