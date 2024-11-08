'use strict';

export enum ColorPalette {
  // Where these colors are used:

  // Default (Blue)
  // - Default color for embeds
  Default = '#88c0d0',

  // Success (Green)
  // - When a command is successful
  // Ex. When a track is added to the queue
  Success = '#a3be8c',

  // Error (Red)
  // - When a command is unsuccessful, cancelled, or an error occurs
  // Ex. When a track cannot be played
  Error = '#bf616a',

  // Notice (Orange)
  // - When a message requires attention
  // Ex. When a track is removed, or the queue is cleared
  Notice = '#d08770',

  // Info (Purple)
  // - When a command provides info, or an item is updated
  // Ex. When a track plays
  Info = '#b48ead',

  // Selection (Yellow)
  // - When a command requires a selection
  // Ex. When the user is selecting a track to play
  Selection = '#ebcb8b'
}
