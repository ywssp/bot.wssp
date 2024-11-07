'use strict';

import { Listener } from '@sapphire/framework';

export class DebugListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'debug'
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public run(message: string) {
    // Just uncomment this line of code to enable debug logging
    // Console.debug(message);
  }
}
