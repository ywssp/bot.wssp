'use strict';

const createEmbed = require('./EmbedCreator.js');
const ytdl = require('ytdl-core');

async function playSong(msg) {
  const song =
    msg.guild.musicData.loop === 'track'
      ? msg.guild.musicData.nowPlaying
      : msg.guild.musicData.queue[0];
  await song.voiceChannel
    .join()
    .then((connection) => {
      const dispatcher = connection
        .play(
          ytdl(song.url, {
            begin: song.seek ? song.seek : 0,
            quality: 'highestaudio'
          })
        )
        .once('start', async () => {
          console.log(song.seek);
          msg.guild.musicData.songDispatcher = dispatcher;
          dispatcher.setVolume(msg.guild.musicData.volume);
          const songEmbed = await createEmbed(msg, {
            preset: 'default',
            title: 'Now playing:',
            fields: [
              {
                name: 'Title',
                value: song.title
              },
              {
                name: 'Channel',
                value: song.channelName
              },
              {
                name: 'Length',
                value: song.durationString
              },
              {
                name: 'URL',
                value: song.url
              },
              {
                name: 'Requester',
                value: song.requester
              }
            ],
            thumbnail: song.thumbnail,
            footer: `${
              msg.guild.musicData.songDispatcher.paused ? '⏸️' : '▶️'
            } | ${msg.guild.musicData.loop.emoji} | 🔊 ${
              msg.guild.musicData.volume * 50
            }`
          });
          if (msg.guild.musicData.loop !== 'track') {
            msg.guild.musicData.queue.shift();
          }
          if (msg.guild.musicData.queue[0]) {
            songEmbed.addFields(
              { name: '\u200B', value: '\u200B' },
              {
                name: 'Next Song',
                value: msg.guild.musicData.queue[0].title
              }
            );
          }
          msg.guild.musicData.nowPlaying = song;
          if (!msg.guild.musicData.hideNextSongs) {
            msg.channel.send(songEmbed);
          }
        })
        .once('finish', () => {
          if (msg.guild.musicData.loop === 'queue') {
            msg.guild.musicData.queue.push(msg.guild.musicData.nowPlaying);
          }

          if (
            msg.guild.musicData.queue.length >= 1 ||
            msg.guild.musicData.loop === 'track'
          ) {
            return playSong(msg);
          }
          msg.guild.musicData.isPlaying = false;
          msg.guild.musicData.hideNextSongs = false;
          msg.guild.musicData.nowPlaying = null;
          msg.guild.musicData.loop = false;
          msg.guild.musicData.songDispatcher = null;
          return msg.guild.me.voice.channel.leave();
        })
        .once('error', (e) => {
          createEmbed(msg, {
            preset: 'error',
            descShort: 'playing the song',
            send: 'channel'
          });
          console.error(e);
          msg.guild.musicData.queue.length = 0;
          msg.guild.musicData.isPlaying = false;
          msg.guild.musicData.hideNextSongs = false;
          msg.guild.musicData.nowPlaying = null;
          msg.guild.musicData.songDispatcher = null;
          return msg.guild.me.voice.channel.leave();
        });
    })
    .catch((e) => {
      console.error(e);
      return msg.guild.me.voice.channel.leave();
    });
}

module.exports = playSong;
