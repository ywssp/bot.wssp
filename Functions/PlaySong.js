'use strict';

const createEmbed = require('./EmbedCreator.js');
const ytdl = require('ytdl-core');

// eslint-disable-next-line consistent-return
async function playSong(msg) {
  if (msg.guild.me.voice.channel) {
    const vcMembers = msg.guild.me.voice.channel.members;

    if (vcMembers.filter((vcMember) => !vcMember.user.bot).size < 1) {
      msg.guild.musicData.queue.length = 0;
      msg.guild.musicData.isPlaying = false;
      msg.guild.musicData.hideNextSongs = false;
      msg.guild.musicData.nowPlaying = null;
      msg.guild.musicData.loop.setting = 'off';
      msg.guild.musicData.songDispatcher = null;
      msg.guild.me.voice.channel.leave();

      console.log('No users in voice chat. Leaving VC.');

      return createEmbed(msg, {
        preset: 'error',
        description: 'No users are in the voice chat. Leaving VC.',
        send: 'channel'
      });
    }
  }

  const song =
    msg.guild.musicData.loop.setting === 'track'
      ? msg.guild.musicData.nowPlaying
      : msg.guild.musicData.queue[0];
  await song.voiceChannel
    .join()
    .then((connection) => {
      const dispatcher = connection
        .play(
          ytdl(song.url, {
            quality: 'highestaudio'
          })
        )
        .once('start', async () => {
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
          if (msg.guild.musicData.loop.setting !== 'track') {
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
          if (msg.guild.musicData.loop.setting === 'queue') {
            msg.guild.musicData.queue.push(msg.guild.musicData.nowPlaying);
          }

          if (
            msg.guild.musicData.queue.length >= 1 ||
            msg.guild.musicData.loop.setting === 'track'
          ) {
            return playSong(msg);
          }
          msg.guild.musicData.isPlaying = false;
          msg.guild.musicData.hideNextSongs = false;
          msg.guild.musicData.nowPlaying = null;
          msg.guild.musicData.loop.setting = 'off';
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
          msg.guild.musicData.loop.setting = 'off';
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
