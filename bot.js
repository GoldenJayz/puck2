const Discord = require("discord.js");
const ytdl = require("ytdl-core");
const moment = require("moment");
const search = require("youtube-search");
const opts = {
  maxResults: 25,
  key: "nope",
  type: 'video'
};


let prefix = "-";

const client = new Discord.Client();

const queue = new Map();

client.once("ready", () => {
  console.log("Ready!");
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect!");
});

client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const serverQueue = queue.get(message.guild.id);

  if (message.content.startsWith(`${prefix}play`)) {
    execute(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}join`)) {
    join(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}leave`)) {
    leave(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}loop`)) {
    if (!message.member.voice.channel)
      return message.channel.send(
        "You need to be inside a voice channel idiot"
      );
    if (!serverQueue)
      return message.channel.send("There is not a song playing currently!");

    serverQueue.loop = !serverQueue.loop;

    return message.channel.send(
      `Looping is now ${serverQueue.loop ? `**Enabled**` : `**Disabled**`}`
    );
  } else if (message.content.startsWith(`${prefix}volume`)) {
    volume(message, serverQueue);
    volume(message, message.content.split(" "), serverQueue);
  } else if (message.content.startsWith(`${prefix}search`)) {
    s(message, serverQueue)
    async function s(message, serverQueue) {
      let embed = new Discord.MessageEmbed()
            .setColor("#73ffdc")
            .setDescription("Please enter a search query. Remember to narrow down your search.")
            .setTitle("YouTube Search API");
        let embedMsg = await message.channel.send(embed);
        let filter = m => m.author.id === message.author.id;
        let query = await message.channel.awaitMessages(filter, { max: 1 });
        let results = await search(query.first().content, opts).catch(err => console.log(err));
        if(results) {
            let youtubeResults = results.results;
            let i  =0;
            let titles = youtubeResults.map(result => {
                i++;
                return i + ") " + result.title;
            });
            console.log(titles);
            message.channel.send({
                embed: {
                    title: 'Select which song you want by typing the number',
                    description: titles.join("\n"),
                    author: {
                      name: message.author.tag,
                      icon_url: message.author.avatarURL(),
                    },
                    thumbnail: {
                      url: "https://cdn.discordapp.com/avatars/767087798804283403/c763a1556e16a62e576fbb98a174a374.png?size=1024",
                    },
                    timestamp: new Date(),
                    footer: {
                      text: 'Select a song',
                      icon_url: "https://cdn.discordapp.com/avatars/767087798804283403/c763a1556e16a62e576fbb98a174a374.png?size=1024",
                    },
                    
                }
            }).catch(err => console.log(err));
            
            filter = m => (m.author.id === message.author.id) && m.content >= 1 && m.content <= youtubeResults.length;
            let collected = await message.channel.awaitMessages(filter, { max: 1 });
            let selected = youtubeResults[collected.first().content - 1];

            console.log(selected.link);

          
            const voiceChannel = message.member.voice.channel;
            const songInfo = await ytdl.getInfo(selected.link);
            const song = {
              title: songInfo.videoDetails.title,
              url: songInfo.videoDetails.video_url
            };

            if (!serverQueue) {
              const queueContruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true
              };

              queue.set(message.guild.id, queueContruct);

              queueContruct.songs.push(song);

              try {
                var connection = await voiceChannel.join();
                queueContruct.connection = connection;
                play(message.guild, queueContruct.songs[0]);
              } catch (err) {
                console.error(err);
                queue.delete(message.guild.id);
                return message.channel.send(err);
              }
            } else {
              serverQueue.songs.push(song);
              const embed = new Discord.MessageEmbed()
                .setTitle("Play")
                .setColor("#0099ff")
                .setURL("https://puckpanel.glitch.me/")
                .setAuthor(message.author.tag, message.author.avatarURL())
                .setThumbnail(
                  "https://cdn.discordapp.com/avatars/767087798804283403/c763a1556e16a62e576fbb98a174a374.png?size=1024"
                )
                .addField("Channel:", message.member.voice.channel.name)
                .addField("Song Name:", `${song.title}`)
                .setTimestamp()
                .setFooter(
                  "I have a poop fetish",
                  "https://cdn.discordapp.com/avatars/767087798804283403/c763a1556e16a62e576fbb98a174a374.png?size=1024"
                );

              return message.channel.send(embed);
            }

          }
    }
    
        }
});



async function volume(message, args, serverQueue) {
  if (!serverQueue) return;
  if (!args[1])
    return message.channel.send(
      `Current Volume is: ${serverQueue.volume || 1}`
    );
  if (Number(args[1]) <= 0 || Number(args[1]) > 2)
    return message.channel.send("Volume only goes from 1-2");

  serverQueue.connection.dispatcher.setVolumeLogarithmic(Number(args[1]));
  serverQueue.volume = Number(args[1]);
  message.channel.send(`Volume has been adjusted to: ${args[1]}`);
}
async function join(message, serverQueue, member) {
  if (message.member.voice.channel) {
    const connection = await message.member.voice.channel.join();
    const embed = new Discord.MessageEmbed()
      .setTitle("Joined")
      .setColor("#0099ff")
      .setURL("https://puckpanel.glitch.me/")
      .setAuthor(message.author.tag, message.author.avatarURL())
      .setThumbnail(
        "https://cdn.discordapp.com/avatars/767087798804283403/c763a1556e16a62e576fbb98a174a374.png?size=1024"
      )
      .addField("Channel:", message.member.voice.channel.name)
      .setTimestamp()
      .setFooter(
        "I sniff little children",
        "https://cdn.discordapp.com/avatars/767087798804283403/c763a1556e16a62e576fbb98a174a374.png?size=1024"
      );

    message.channel.send(embed);
  }
}

async function leave(message) {
  if (message.member.voice.channel) {
    const connection = await message.member.voice.channel.leave();
    const embed = new Discord.MessageEmbed()
      .setTitle("Left")
      .setColor("#0099ff")
      .setURL("https://puckpanel.glitch.me/")
      .setAuthor(message.author.tag, message.author.avatarURL())
      .setThumbnail(
        "https://cdn.discordapp.com/avatars/767087798804283403/c763a1556e16a62e576fbb98a174a374.png?size=1024"
      )
      .addField("Channel:", message.member.voice.channel.name)
      .setTimestamp()
      .setFooter(
        "I hit on underage girls",
        "https://cdn.discordapp.com/avatars/767087798804283403/c763a1556e16a62e576fbb98a174a374.png?size=1024"
      );

    message.channel.send(embed);
  }
}

async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "You need to be in a voice channel to play music!"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "I need the permissions to join and speak in your voice channel!"
    );
  }

  const songInfo = await ytdl.getInfo(args[1]);
  const song = {
    title: songInfo.videoDetails.title,
    url: songInfo.videoDetails.video_url
  };

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.error(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    const embed = new Discord.MessageEmbed()
      .setTitle("Play")
      .setColor("#0099ff")
      .setURL("https://puckpanel.glitch.me/")
      .setAuthor(message.author.tag, message.author.avatarURL())
      .setThumbnail(
        "https://cdn.discordapp.com/avatars/767087798804283403/c763a1556e16a62e576fbb98a174a374.png?size=1024"
      )
      .addField("Channel:", message.member.voice.channel.name)
      .addField("Song Name:", `${song.title}`)
      .setTimestamp()
      .setFooter(
        "I have a poop fetish",
        "https://cdn.discordapp.com/avatars/767087798804283403/c763a1556e16a62e576fbb98a174a374.png?size=1024"
      );

    return message.channel.send(embed);
  }
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  if (!serverQueue)
    return message.channel.send("There is no song that I could skip!");
  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

async function play(guild, song, message) {
  const serverQueue = queue.get(guild.id);
  
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      if (!serverQueue.loop) serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  const embed = new Discord.MessageEmbed()
    .setTitle("Play")
    .setColor("#0099ff")
    .setURL("https://puckpanel.glitch.me/")
    .setThumbnail(
      "https://cdn.discordapp.com/avatars/767087798804283403/c763a1556e16a62e576fbb98a174a374.png?size=1024"
    )
    .setTimestamp()
    .addField("Song Name:", `${song.title}`)
    .setFooter(
      "I sniff little children",
      "https://cdn.discordapp.com/avatars/767087798804283403/c763a1556e16a62e576fbb98a174a374.png?size=1024"
    );

  serverQueue.textChannel.send(embed);
}

client.login("");
