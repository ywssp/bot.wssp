'use strict';

import { Listener } from '@sapphire/framework';

export class DebugListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'debug'
    });
  }

  public run(message: string) {
    if (!process.env.DEBUG) {
      return;
    }

    this.container.logger.debug(message);
  }
}
