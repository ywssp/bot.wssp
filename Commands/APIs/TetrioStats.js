'use strict';
const { Command } = require('discord-akairo');
const fetch = require('node-fetch');
const countries = require('i18n-iso-countries');
const createEmbed = require('../../Functions/EmbedCreator.js');
const {
  formatDuration,
  secondsToObj
} = require('../../Functions/MusicFunctions.js');

class TetrioCommand extends Command {
  constructor() {
    super('tetrio', {
      aliases: ['tetrio'],
      args: [
        {
          id: 'user',
          match: 'content',
          prompt: {
            start: (message) =>
              createEmbed(message, {
                preset: 'query',
                title: 'User',
                description: 'Enter a user name',
                authorBool: true
              })
          }
        }
      ],
      category: 'APIs'
    });
  }

  async exec(message, args) {
    const userData = await fetch(
      `https://ch.tetr.io/api/users/${args.user}`
    ).then((resp) => resp.json());

    const userRecords = await fetch(
      `https://ch.tetr.io/api/users/${args.user}/records`
    ).then((resp) => resp.json());

    if (userData.success) {
      const basicData = userData.data.user;
      const leagueData = userData.data.user.league;

      if (basicData.role === 'bot') {
        return createEmbed(message, {
          preset: 'default',
          title: basicData.username.toUpperCase(),
          url: `https://ch.tetr.io/u/${basicData.username}`,
          thumbnail: basicData.avatar_revision
            ? `https://tetr.io/user-content/avatars/${basicData._id}.jpg?rv=${basicData.avatar_revision}`
            : '',
          description: `This user is a bot.\nMade by ${basicData.botmaster}.`,
          footer:
            'This command uses the TETR.IO API https://tetr.io/about/api/',
          authorBool: true,
          send: 'channel'
        });
      } else if (basicData.role === 'banned') {
        return createEmbed(message, {
          preset: 'error',
          title: basicData.username.toUpperCase(),
          url: `https://ch.tetr.io/u/${basicData.username}`,
          thumbnail: 'https://tetr.io/res/avatar-banned.png',
          description: 'This user is banned.',
          footer:
            'This command uses the TETR.IO API https://tetr.io/about/api/',
          authorBool: true,
          send: 'channel'
        });
      } else if (basicData.role === 'anon') {
        return createEmbed(message, {
          preset: 'error',
          title: basicData.username.toUpperCase(),
          url: `https://ch.tetr.io/u/${basicData.username}`,
          thumbnail: 'https://tetr.io/res/avatar.png',
          description:
            'This user is anonymous. Anonymous accounts have no meaningful statistics and cannot save replays.',
          footer:
            'This command uses the TETR.IO API https://tetr.io/about/api/',
          authorBool: true,
          send: 'channel'
        });
      }

      let description = '';

      if (basicData.bio) {
        description += basicData.bio + '\n\n';
      }

      // Two accounts use this country code, and the module used to convert the country codes to names does not support this code.
      if (basicData.country === 'XM') {
        description += 'Country: The Moon';
      } else if (basicData.country !== null) {
        description += `Country: ${countries.getName(
          basicData.country,
          'en'
        )} :flag_${basicData.country.toLowerCase()}:`;
      } else {
        description += 'Country: Hidden';
      }

      description +=
        '\nLevel: ' +
        Math.floor(
          Math.pow(basicData.xp / 500, 0.6) +
            basicData.xp / (5000 + Math.max(0, basicData.xp - 4000000) / 5000) +
            1
        );

      // Data for public games (Custom or Quick Play)
      description += '\nPublic Games (Wins/Total): ';

      if (basicData.gamesplayed > 0) {
        description +=
          basicData.gameswon +
          '/' +
          basicData.gamesplayed +
          ' (' +
          +((basicData.gameswon / basicData.gamesplayed) * 100).toFixed(2) +
          '%)';
      } else {
        description += 'Never Played';
      }

      // Data for Tetra League
      let leagueDesc = 'Never Played';

      if (leagueData.gamesplayed > 0) {
        leagueDesc =
          'Games (W/T): ' +
          leagueData.gameswon +
          '/' +
          leagueData.gamesplayed +
          ' (' +
          +((leagueData.gameswon / leagueData.gamesplayed) * 100).toFixed(2) +
          '%)';

        let leagueRank =
          leagueData.rank !== 'z' ? leagueData.rank.toUpperCase() : 'Unranked';

        if (leagueData.rank !== 'z') {
          const progressRange = leagueData.next_at - leagueData.prev_at;
          const relativeRank = leagueData.standing - leagueData.next_at;

          const progress = Math.floor((relativeRank / progressRange + 1) * 100);

          if (leagueData.rank !== 'x') {
            leagueRank +=
              ' (' +
              progress +
              '% towards ' +
              leagueData.next_rank.toUpperCase() +
              ')';
          }
        } else if (leagueData.percentile_rank !== 'z') {
          leagueRank +=
            ' (Probably around ' +
            leagueData.percentile_rank.toUpperCase() +
            ')';
        }

        leagueDesc += '\nRank: ' + leagueRank;

        if (leagueData.rating > -1) {
          leagueDesc += `\nRating: ${Math.floor(
            leagueData.rating
          )} TR (Glicko: ${Math.round(leagueData.glicko)}±${Math.round(
            leagueData.rd
          )})`;
        }

        if (leagueData.standing > -1) {
          leagueDesc += `\nRanking: [${leagueData.standing.toLocaleString()}](https://ch.tetr.io/players/#${
            leagueData.rating
          }:${leagueData.standing})`;
          if (leagueData.standing_local > -1) {
            leagueDesc += ` | [${leagueData.standing_local.toLocaleString()}](https://ch.tetr.io/players/#${
              leagueData.rating
            }:${leagueData.standing_local}:${
              basicData.country
            }) on local leaderboards`;
          }
        } else {
          leagueDesc += '\nRanking: Not on Leaderboards';
        }
      }

      const embedObject = {
        preset: 'default',
        title: basicData.username.toUpperCase(),
        url: `https://ch.tetr.io/u/${basicData.username}`,
        description,
        fields: [
          {
            name: 'TETRA LEAGUE',
            value: leagueDesc
          }
        ],
        footer: 'This command uses the TETR.IO API https://tetr.io/about/api/',
        authorBool: true,
        send: 'channel'
      };

      if (basicData.verified) {
        embedObject.title += ' ✅';
      }

      if (userRecords.success) {
        const recordData = {
          zen: userRecords.data.zen,
          blitz: userRecords.data.records.blitz,
          fortyL: userRecords.data.records['40l']
        };

        // Info for Blitz
        let blitz = 'No Records';

        if (recordData.blitz.record) {
          blitz = `[${recordData.blitz.record.endcontext.score.toLocaleString()}](https://tetr.io/#r:${
            recordData.blitz.record.replayid
          })`;

          if (recordData.blitz.rank !== null) {
            blitz += '\nNo. ' + recordData.blitz.rank.toLocaleString();
          } else {
            blitz += '\nNot on leaderboards';
          }
        }

        // Info for Sprint (40 Lines)
        let fortylines = 'No Records';

        if (recordData.fortyL.record) {
          // Time formatting
          let time = '';
          time += formatDuration(
            secondsToObj(
              Math.floor(recordData.fortyL.record.endcontext.finalTime / 1000)
            )
          );
          time +=
            '.' +
            (Math.floor(recordData.fortyL.record.endcontext.finalTime) % 1000);

          fortylines = `[${time}](https://tetr.io/#r:${recordData.fortyL.record.replayid})`;

          if (recordData.fortyL.rank !== null) {
            fortylines += '\nNo. ' + recordData.fortyL.rank.toLocaleString();
          } else {
            fortylines += '\nNot on leaderboards';
          }
        }

        embedObject.fields.push(
          {
            name: 'BLITZ',
            value: blitz
          },
          {
            name: '40 LINES',
            value: fortylines
          },
          {
            name: 'ZEN',
            value: `Level ${
              recordData.zen.level
            }\nScore: ${recordData.zen.score.toLocaleString()}`
          }
        );
      }

      if (basicData.avatar_revision) {
        embedObject.thumbnail = `https://tetr.io/user-content/avatars/${basicData._id}.jpg?rv=${basicData.avatar_revision}`;
      }

      if (basicData.supporter && basicData.banner_revision) {
        embedObject.image = `https://tetr.io/user-content/banners/${basicData._id}.jpg?rv=${basicData.banner_revision}`;
      }

      return createEmbed(message, embedObject);
    }

    return createEmbed(message, {
      preset: 'error',
      description: userData.error,
      footer: 'This command uses the TETR.IO API https://tetr.io/about/api/',
      authorBool: true,
      send: 'channel'
    });
  }
}

module.exports = TetrioCommand;
