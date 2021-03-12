'use strict';
const { Command, Argument } = require('discord-akairo');
const fetch = require('node-fetch');
const createEmbed = require('../../Functions/EmbedCreator.js');
const {
  fetchCategories,
  parseQuestionToEmbed,
  generateArgPrompt,
} = require('../../Functions/TriviaFunctions.js');

class TriviaCommand extends Command {
  constructor() {
    super('trivia', {
      aliases: ['trivia'],
      category: 'APIs',
    });
  }

  async *args() {
    const categories = await fetchCategories();

    const category = yield generateArgPrompt(
      (message, phrase) => {
        if (
          phrase.toLowerCase() === 'any' ||
          (phrase >= categories[1][0] && phrase <= categories[1][1])
        ) {
          return phrase.toLowerCase();
        }

        return null;
      },
      'Category',
      `Select a category from below, or type \`any\`\n${categories[0]}`
    );

    const difficulty = yield generateArgPrompt(
      (message, phrase) => {
        if ((/(easy)|(medium)|(hard)|(any)/gi).test(phrase)) {
          return (/(easy)|(medium)|(hard)|(any)/gi).exec(phrase)[0].toLowerCase();
        }
        return null;
      },
      'Difficulty',
      'Select a difficulty\n\nAny\nEasy\nMedium\nHard'
    );

    let qTotal;
    if (category !== 'any') {
      const qNumbers = await fetch(
        `https://opentdb.com/api_count.php?category=${category}`
      ).then((response) => response.json());
      qTotal =
        qNumbers.category_question_count[
          `total${
            difficulty[0] !== 'any' ? `_${difficulty[0]}` : ''
          }_question_count`
        ];
      qTotal = qTotal < 50 ? qTotal : 50;
    } else {
      qTotal = 50;
    }

    const number = yield generateArgPrompt(
      Argument.range('integer', 1, qTotal, true),
      'Number of Questions',
      `Enter the number of questions to give from 1-${qTotal}`
    );

    const type = yield generateArgPrompt(
      (message, phrase) => {
        if ((/(any)|(multiple)|(boolean)/gi).test(phrase)) {
          return (/(any)|(multiple)|(boolean)/gi).exec(phrase)[0].toLowerCase();
        }
        return null;
      },
      'Type of Questions',
      'Select the type of questions to give\n\nAny\nMultiple (Multiple Choice)\nBoolean (True or False)'
    );

    return { category, difficulty, number, type };
  }

  async exec(message, args) {
    const questionSet = await fetch(
      `https://opentdb.com/api.php?amount=${args.number}${
        args.category === 'any' ? '' : `&category=${args.category}`
      }${args.difficulty === 'any' ? '' : `&difficulty=${args.difficulty}`}${
        args.type === 'any' ? '' : `&type=${args.type}`
      }&encode=base64`
    ).then((response) => response.json());
    if (questionSet.response_code !== 0) {
      return createEmbed(message, 'error', {
        descShort: 'fetching the trivia questions',
        send: 'command',
      });
    }

    const scores = {};

    for (const question of questionSet.results) {
      const answer = parseQuestionToEmbed(question, message);
      await message.channel
        .awaitMessages((x) => x.content.length > 0, {
          max: 1,
          time: 30000,
          errors: ['time'],
        })
        .then((collected) => {
          if (collected.first().content.toLowerCase()[0] === answer[0]) {
            createEmbed(collected.first(), 'success', {
              title: 'Yay!',
              description: 'Your answer is correct!',
              authorBool: true,
              send: 'channel',
            });
            if (!scores[collected.first().author]) {
              scores[collected.first().author] = 1;
            } else {
              scores[collected.first().author]++;
            }
          } else {
            createEmbed(collected.first(), 'error', {
              title: 'Wrong!',
              description: `The answer was ${answer[1]}`,
              authorBool: true,
              send: 'channel',
            });
            if (typeof scores[collected.first().author] !== 'number') {
              scores[collected.first().author] = 0;
            }
          }
        })
        .catch(() => {
          createEmbed(message, 'error', {
            title: 'Times up!',
            description: `The answer was ${answer[1]}`,
            send: 'channel',
          });
        });
    }
    let scoreString = '';
    for (const user of Object.entries(scores)) {
      scoreString += `\n${user[0]}: ${user[1]}`;
    }

    return createEmbed(message, 'default', {
      title: 'Scores',
      description: scoreString,
      send: 'channel',
    });
  }
}

module.exports = TriviaCommand;
