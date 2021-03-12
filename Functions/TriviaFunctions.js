'use strict';
const fetch = require('node-fetch');
const createEmbed = require('./EmbedCreator.js');

module.exports = {
  fetchCategories: async () => {
    let categories = await fetch(
      'https://opentdb.com/api_category.php'
    ).then((response) => response.json());
    categories = categories.trivia_categories;
    const output = [''];
    for (const category of categories) {
      output[0] += `\n${category.id}: ${category.name}`;
    }
    output.push([categories[0].id, categories[categories.length - 1].id]);
    return output;
  },
  parseQuestionToEmbed: (qObject, message) => {
    const shuffle = (arr) => {
      let i = arr.length;
      let j;
      let temp;
      while (--i > 0) {
        j = Math.floor(Math.random() * (i + 1));
        temp = arr[j];
        arr[j] = arr[i];
        arr[i] = temp;
      }
    };

    const b64toText = (str) => Buffer.from(str, 'base64').toString('utf8');

    const choices = [
      {
        id: 'YQ==',
        content: '',
      },
      {
        id: 'Yg==',
        content: '',
      },
      {
        id: 'Yw==',
        content: '',
      },
      {
        id: 'ZA==',
        content: '',
      },
    ];

    const cAnswer = qObject.correct_answer;
    const allAnswers = qObject.incorrect_answers;
    allAnswers.push(cAnswer);
    shuffle(allAnswers);
    for (let i = 0; i < allAnswers.length; i++) {
      choices[i].content = allAnswers[i];
    }

    let answerString = '';
    for (const choice of choices) {
      if (choice.content) {
        answerString += `\n${b64toText(choice.id).toUpperCase()}. ${b64toText(
          choice.content
        )}`;
      }
    }

    createEmbed(message, 'query', {
      title: `${b64toText(qObject.category)} | ${
        b64toText(qObject.difficulty).charAt(0).toUpperCase() +
        b64toText(qObject.difficulty).slice(1)
      }`,
      description: `${b64toText(qObject.question)}\n${answerString}`,
      send: 'channel',
    });

    const cAnswerLetter = b64toText(
      choices.find((x) => x.content === cAnswer).id
    );

    return [
      cAnswerLetter,
      `${cAnswerLetter.toUpperCase()}. ${b64toText(cAnswer)}`,
    ];
  },
  generateArgPrompt: (type, title, description) => ({
    type,
    prompt: {
      start: (message) =>
        createEmbed(message, 'query', {
          title,
          description,
        }),
      retry: (message) =>
        createEmbed(message, 'error', {
          description: 'Your input is invalid!',
        }),
    },
  }),
};
