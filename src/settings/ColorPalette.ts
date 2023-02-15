// Where these colors are used:
// Default (Blue)
// - Default color for embeds
// Success (Green)
// - When a command is successful
// Ex. When a track is added to the queue
// Error (Red)
// - When a command is unsuccessful, or has been cancelled
// Ex. When a track is removed from the queue
// Info (Purple)
// - When a command is informational, or an item is updated
// Ex. When a track plays
// Selection (Yellow)
// - When a command requires a selection
// Ex. When the user is selecting a song to play

export enum ColorPalette {
  Default = '#88c0d0',
  Success = '#a3be8c',
  Error = '#bf616a',
  Info = '#b48ead',
  Selection = '#ebcb8b'
}
