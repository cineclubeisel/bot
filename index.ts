import { Channel, ChannelType, Client, EmbedBuilder, GatewayIntentBits, GuildBasedChannel, NewsChannel, Partials, SendableChannels, Snowflake, TextBasedChannel, TextChannel } from 'discord.js'

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
    await channels.updates.send(`<:enter:1549787187350863964> ${member} juntou-se ao servidor`)
    await member.roles.add(MEMBER_ROLE_ID)
})

bot.on('guildMemberRemove', async member=>{
    if(member.guild.id !== GUILD_ID) return
    channels.updates.send(`<:leave:1549787189250891877> ${member.displayName} saiu do servidor`)
})

bot.on('messageCreate', async msg=>{
    if(msg.author.id === bot.user?.id) return

    if(msg.content == '!invite' && msg.channel.id === channels.direcao.id && msg.author.id === BERNZRDO_ID){
        
        const invite = await channels.geral.createInvite({
            maxAge: 48 * 60 * 60, // 48h
            maxUses: 1
        })

        const inviteMsg = await msg.channel.send(`Olá, nome! O Cineclube ISEL dá-te as boas-vindas. :)

Junta-te ao nosso servidor de Discord para poderes participar na nossa comunidade.
${invite} (link válido por 48h)

Com os melhores cumprimentos,
Bernardo Silva
Presidente @ Cineclube ISEL`)
        
        await msg.delete()

        setTimeout(()=>inviteMsg.delete(), 10e3)
        
    }

//     if(msg.content == 'vote' && msg.channel.type == ChannelType.GuildText){
//         await msg.delete()
//         await msg.channel.send({
//             files: [join(__dirname, 'image.png')]
//         })
//         await msg.channel.send({
//             content: `# Vota no filme da 1.ª sessão
// * [Tudo Sobre a Minha Mãe (1999)](https://letterboxd.com/film/all-about-my-mother/)
// * [O Fabuloso Destino de Amélie (2001)](https://letterboxd.com/film/amelie/)
// * [Blue Valentine - Só Tu e Eu (2010)](https://letterboxd.com/film/blue-valentine/)
// * [O Clube de Dallas (2013)](https://letterboxd.com/film/dallas-buyers-club/)
// * [Forrest Gump (1994)](https://letterboxd.com/film/forrest-gump/)`
//         })
//         await msg.channel.send({
//             poll: {
//                 question: {
//                     text: 'Vota no filme da 1.ª sessão'
//                 },
//                 answers: [
//                     { text: 'Tudo Sobre a Minha Mãe (1999)' },
//                     { text: 'O Fabuloso Destino de Amélie (2001)' },
//                     { text: 'Blue Valentine - Só Tu e Eu (2010)' },
//                     { text: 'O Clube de Dallas (2013)' },
//                     { text: 'Forrest Gump (1994)' }
//                 ],
//                 duration: 242,
//                 allowMultiselect: false
//             }
//         })
//     }
//     if(msg.content == 'invite' && msg.channel.type == ChannelType.GuildText){
//         msg.channel.createInvite({
//             maxAge: 0,
            
//         })
//     }

})

bot.login(process.env.TOKEN)