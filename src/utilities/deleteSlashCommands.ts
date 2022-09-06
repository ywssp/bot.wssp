/* eslint-disable @typescript-eslint/no-non-null-assertion */
import 'dotenv/config';

import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

const rest = new REST({ version: '9' }).setToken(token!);
rest
  .put(Routes.applicationCommands(clientId!), { body: [] })
  .then(() => console.log('Successfully deleted all application commands.'))
  .catch(console.error);
