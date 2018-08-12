"use strict"
import core from './FalconBase'
import https from "https"
import discord from 'discord.js'

// Twitch
class Twitch{
    constructor(){
        this.interval = 60 * 1000;
        this.apiUrl = "https://api.twitch.tv/kraken";
        this.timeout = 2 * 60 * 1000;
    }
    callApi(server, twitchChannel, callback, getStreamInfo) {
        var opt;
        try {
            var apiPath;
            if (getStreamInfo) {
                apiPath = "/kraken/streams/" + twitchChannel.name.trim();
            } else {
                apiPath = "/kraken/channels/" + twitchChannel.name.trim();
            }
            opt = {
                host: "api.twitch.tv",
                path: apiPath,
                headers: {
                    "Client-ID": core.config.twitchClientID,
                    Accept: "application/vnd.twitchtv.v3+json"
                }
            };
        }
        catch (err) {
            core.print(err);
            return;
        }
    
        https.get(opt, (res) => {
            var body = "";
    
            res.on("data", (chunk) => {
                body += chunk;
            });
    
            res.on("end", () => {
                var json;
                try {
                    json = JSON.parse(body);
                }
                catch (err) {
                    core.print(err);
                    return;
                }
                if (json.status == 404) {
                    callback(server, undefined, undefined);
                } else {
                    callback(server, twitchChannel, json);
                }
            });
    
        }).on("error", (err) => {
            core.print(err);
        });
    }
    apiCallback(server, twitchChannel, res) {
        if (res && !twitchChannel.online && res.stream &&
            twitchChannel.timestamp + timeout <= Date.now()) {
            try {
                var channels = [], defaultChannel;
                var guild = core.bot.guilds.find("name", server.name);
    
    
                if (server.discordChannels.length === 0) {
                    defaultChannel = guild.channels.find("type", "text");
                } else {
                    for (let i = 0; i < server.discordChannels.length; i++) {
                        channels.push(guild.channels.find("name", server.discordChannels[i]));
                    }
                }
                var embed = new discord.RichEmbed()
                    .setColor("#9689b9")
                    .setTitle(res.stream.channel.display_name.replace(/_/g, "\\_"))
                    .setURL(res.stream.channel.url)
                    .setDescription("**" + res.stream.channel.status +
                    "**\n" + res.stream.game)
                    .setImage(res.stream.channel.logo)
                    .addField("Viewers", res.stream.viewers, true)
                    .addField("Followers", res.stream.channel.followers, true);
                
                // Making a personnalized message for every streamer that is register
                if (channels.length !== 0) {
                    for (let i = 0; i < channels.length; i++) {
                        channels[i].send('@everyone Olala le fameux ' + res.stream.channel.display_name.replace(/_/g, "\\_") + ' est actuellement en ligne sur le jeu ' + res.stream.game + ' \n Rejoignez le !').then(
                            channels[i].send(embed)).then(
                            core.print("Sent embed to channel '" + channels[i].name +
                                "'.")
                            );
                    }
                    twitchChannel.online = true;
                    twitchChannel.timestamp = Date.now();
                }
            }
            catch (err) {
                core.print(err);
            }
        } else if (res.stream === null) {
            twitchChannel.online = false;
        }
    }
    
    tick() {
        for (let i = 0; i < core.servers.length; i++) {
            for (let j = 0; j < core.servers[i].twitchChannels.length; j++) {
                for (let k = -1; k < core.servers[i].discordChannels.length; k++) {
                    if (core.servers[i].twitchChannels[j]) {
                        this.callApi(servers[i], servers[i].twitchChannels[j], apiCallback, true);
                    }
                }
            }
        }
    }

}

module.exports = new Twitch