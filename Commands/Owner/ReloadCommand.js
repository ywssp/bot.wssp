'use strict';
const { Command } = require('discord-akairo');

class ReloadCommand extends Command {
  constructor() {
    super('reload', {
      aliases: ['reload'],
      args: [
        {
          id: 'commandID',
          default: 'all',
        },
      ],
      ownerOnly: true,
      category: 'owner-only',
    });
  }

  exec(message, args) {
    if (args.commandID === 'all') {
      this.handler.reloadAll();
      return message.channel.send(
        `Reloaded ${this.handler.modules.map((m) => m).length} command(s)!`
      );
    }
    try {
      this.handler.reload(args.commandID);
      return message.channel.send(`Reloaded command ${args.commandID}!`);
    } catch {
      try {
        const category = this.handler.categories
          .map((c) => c)
          .filter((c) => c === args.commandID)[0];
        category.reloadAll();

        return message.channel.send(
          `Reloaded category ${args.commandID}!\nReloaded ${
            category.map((m) => m).length
          } command(s)!`
        );
      } catch (e) {
        return message.channel.send(
          `${args.commandID} is not a valid category/command ID!`
        );
      }
    }
  }
}

module.exports = ReloadCommand;
