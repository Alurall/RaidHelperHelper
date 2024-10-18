async function newEvent(message, token, dungeon) {
    let thread = message.channel;
    const url = `https://raid-helper.dev/api/v2/servers/${thread.guildId}/channels/${thread.id}/event`
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': token,
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
                    show_info: false,
                    font_style: 0,
                    apply_unregister: true,
                    pin_message: true,
                    defaults_pre_req: false,
                    color: dungeon ? dungeon.color : "",
                    create_discordevent: false
                }
            })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
    }
}

async function getEvent(channelId, token, guildId) {
    const url = `https://raid-helper.dev/api/v3/servers/${guildId}/events`
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': token,
                'IncludeSignUps': false,
                'ChannelFilter': `${channelId}`
            }
        });
        const data = await response.json();
        const event = data.postedEvents.find(event => event.channelId == channelId);
        if (event)
            return event.id;
    } catch (error) {
        console.error(error);
    }
}

async function updateEvent(eventId, token, body) {
    const url = `https://raid-helper.dev/api/v2/events/${eventId}`
    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
    }
}

export default { newEvent, getEvent, updateEvent }