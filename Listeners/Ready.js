'use strict';
const { Listener } = require('discord-akairo');
const activities = require('../Others/Activities.js');

class ReadyListener extends Listener {
  constructor() {
    super('ready', {
      emitter: 'client',
      event: 'ready',
    });
  }

  exec() {
    const now = new Date();
    console.log(this.client.user.tag, 'started in', now.toUTCString());

    const genShuffledActs = (actObj) => {
      const activityArray = [];
      for (const actType of actObj) {
        for (const act of actType.list) {
          activityArray.push([actType.type, act]);
        }
      }
      let m = activityArray.length;
      while (m) {
        const i = Math.floor(Math.random() * m--);
        [activityArray[m], activityArray[i]] = [
          activityArray[i],
          activityArray[m],
        ];
      }

      return activityArray;
    };

    let shuffledActs = genShuffledActs(activities);
    const firstAct = shuffledActs.pop();
    this.client.setTimeout(() => {
      this.client.user.setActivity(firstAct[1], {
        type: firstAct[0],
      });
    }, 15000);

    this.client.setInterval(() => {
      if (shuffledActs.length === 0) {
        shuffledActs = genShuffledActs(activities);
      }
      const activity = shuffledActs.pop();
      this.client.user.setActivity(activity[1], {
        type: activity[0],
      });
    }, 60000);
  }
}

module.exports = ReadyListener;
