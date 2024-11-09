'use strict';

import 'dotenv/config';

import { REST, Routes } from 'discord.js';
import inquirer from 'inquirer';
import chalk from 'chalk';

const token = process.env.BOT_TOKEN;
const clientId = process.env.BOT_CLIENT_ID;

if (token === undefined) {
  throw new Error('Please provide a token in the .env file.');
}

const rest = new REST({ version: '9' }).setToken(token);

type Command = {
  id: string;
  application_id: string;
  version: string;
  default_permission: boolean;
  type: number;
  name: string;
  description: string;
  dm_permission: boolean;
};

async function prompt() {
  const method = await inquirer.prompt([
    {
      type: 'list',
      name: 'delete',
      message: 'What do you want to do?',
      choices: [
        {
          name: 'Delete all commands',
          value: 'all'
        },
        {
          name: 'Delete specific commands',
          value: 'specific'
        }
      ]
    }
  ]);

  if (clientId === undefined) {
    throw new Error('Please provide a client id in the .env file.');
  }

  if (method.delete === 'all') {
    try {
      await rest.put(Routes.applicationCommands(clientId), { body: [] });
      // eslint-disable-next-line no-console
      console.log(chalk.green('Successfully deleted all commands.'));
    } catch {
      // eslint-disable-next-line no-console
      console.log(chalk.red('Failed to delete all commands.'));
    }

    return;
  }

  const commands = (await rest.get(
    Routes.applicationCommands(clientId)
  )) as Command[];

  const selectedCommands = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'commands',
      message: 'Select the commands you want to delete.',
      choices: commands.map((command: Command) => ({
        name: command.name,
        value: command.id
      }))
    }
  ]);

  Promise.allSettled(
    selectedCommands.commands.map((commandId: string) =>
      rest.delete(Routes.applicationCommand(clientId, commandId))
    )
  ).then((deletedCommands) => {
    const failed = deletedCommands.filter(
      (command) => command.status === 'rejected'
    ) as PromiseRejectedResult[];

    if (failed.length > 0) {
      // eslint-disable-next-line no-console
      console.log(chalk.red('Failed to delete the following commands:'));
      // eslint-disable-next-line no-console
      failed.forEach((command) => console.log(chalk.red(command.reason)));
    } else {
      // eslint-disable-next-line no-console
      console.log(chalk.green('Successfully deleted all selected commands.'));
    }
  });
}

prompt();
