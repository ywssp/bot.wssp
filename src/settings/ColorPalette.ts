import { ColorResolvable } from 'discord.js';

// Where these colors are used:
// Default (Blue)
// - Default color for embeds
// Success (Green)
// - When a command is successful
// Ex. When a video is added to the queue
// Error (Red)
// - When a command is unsuccessful, or has been cancelled
// Ex. When a video is removed from the queue
// Info (Purple)
// - When a command is informational, or an item is updated
// Ex. When a video plays
// Selection (Yellow)
// - When a command requires a selection
// Ex. When the user is selecting a song to play

export const ColorPalette = {
  default: '#88c0d0' as ColorResolvable,
  success: '#a3be8c' as ColorResolvable,
  error: '#bf616a' as ColorResolvable,
  info: '#b48ead' as ColorResolvable,
  selection: '#ebcb8b' as ColorResolvable
};
