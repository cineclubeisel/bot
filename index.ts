import { Channel, ChannelType, Client, EmbedBuilder, GatewayIntentBits, GuildBasedChannel, NewsChannel, Partials, SendableChannels, Snowflake, TextBasedChannel, TextChannel } from 'discord.js'
import storage from './storage'

interface Channels {
    novidades: NewsChannel
    geral: TextChannel
    direcao: TextChannel
    updates: TextChannel
}

const GUILD_ID = '1549437865249869904'
const MEMBER_ROLE_ID = '1549478403000762448'
const BERNZRDO_ID = '412393476378853376'

const CHANNEL_INFO: Record<keyof Channels, { id: Snowflake, typeCheck: (c: Channel) => boolean }> = {
    novidades: {
        id: '1549519556375089182',
        typeCheck: c => c.type === ChannelType.GuildAnnouncement
    },
    geral: {
        id: '1549482743493169272',
        typeCheck: c => c.type === ChannelType.GuildText
    },
    direcao: {
        id: '1549518750133387284',
        typeCheck: c => c.type === ChannelType.GuildText
    },
    updates: {
        id: '1549518770232361030',
        typeCheck: c => c.type === ChannelType.GuildText
    }
}

let channels: Channels

const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [ Partials.Channel ]
})

bot.on('clientReady', async ()=>{

    // find channels
    let tempMap: Record<string, Channel> = {}
    for(const [name, { id, typeCheck }] of Object.entries(CHANNEL_INFO)){
        const channel = await bot.channels.fetch(id)
        if(!channel) throw new Error(`Failed to find "${name}" channel.`)
        if(!typeCheck(channel)) throw new Error(`The "${name}" channel did not match its type.`)
        tempMap[name] = channel
    }
    channels = tempMap as unknown as Channels

    console.log('Ready!')
})

bot.on('guildMemberAdd', async member=>{
    if(member.guild.id !== GUILD_ID) return

    await storage.read()
    const now = Date.now()

    const activeDbInvites = storage.data.invites.filter(i => i.expiresAt > now)
    const currInvites = (await member.guild.invites.fetch({ channelId: channels.geral.id }))
        .map(i => i.url)
    
    const missingInvites = activeDbInvites.filter(i => !currInvites.includes(i.url))

    let error = ''
    if (missingInvites.length === 1) {
        try {
            await member.setNickname(missingInvites[0].name)
        } catch (err) {
            console.error(`Failed to set nickname for ${member.id}:`, err)
        }
    } else if (missingInvites.length > 1) {
        error = '\nMais do que um dos meus convites foram usados. Não sei de qual deles veio.'
    } else {
        error = '\nProvavelmente entrou com um convite que não era meu.'
    }

    const missingUrls = new Set(missingInvites.map(i => i.url))
    await storage.update(db => {
        db.invites = db.invites.filter(i => i.expiresAt > now && !missingUrls.has(i.url))
    })

    await channels.updates.send(`<:enter:1549787187350863964> ${member} juntou-se ao servidor${error}`)
    await member.roles.add(MEMBER_ROLE_ID)
})

bot.on('guildMemberRemove', async member=>{
    if(member.guild.id !== GUILD_ID) return
    await channels.updates.send(`<:leave:1549787189250891877> ${member.displayName} saiu do servidor`)
})

bot.on('messageCreate', async msg=>{
    if(msg.author.id === bot.user?.id) return

    // bernzrdo
    if(msg.author.id === BERNZRDO_ID){

        if(msg.content.startsWith('!invite')){

            await msg.delete()

            const name = msg.content.substring('!invite '.length)

            if(!name){
                const reply = await msg.channel.send('falta o nome da pessoa...')
                setTimeout(()=>reply.delete(), 3e3)
                return
            }

            const maxAge = 48 * 60 * 60

            const invite = await channels.geral.createInvite({
                maxAge,
                maxUses: 1,
                unique: true
            })

            await storage.update(({ invites }) => invites.push({
                name: name,
                url: invite.url,
                expiresAt: Date.now() + (maxAge * 1e3)
            }))

            const inviteMsg = await msg.channel.send(`Olá, ${name.split(' ')[0]}! O Cineclube ISEL dá-te as boas-vindas. :)

Junta-te ao nosso servidor de Discord para poderes participar na nossa comunidade.
${invite.url} (link válido por 48h)

Com os melhores cumprimentos,
Bernardo Silva
Presidente @ Cineclube ISEL`)

            setTimeout(()=>inviteMsg.delete(), 10e3)
            
        }

    }

})

bot.login(process.env.TOKEN)