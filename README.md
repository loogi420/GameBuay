[![Discord-Gamebuay](https://github-readme-stats.vercel.app/api/pin/?username=navaneethkm004&repo=Discord-Gamebuay&theme=dark)](https://github.com/navaneethkm004/Discord-Gamebuay)<br/>
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fnavaneethkm004%2FDiscord-Gamebuay.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fnavaneethkm004%2FDiscord-Gamebuay?ref=badge_shield)


A bot that lets Discord users play games collaboratively using an emulator.  
Currently has NES, Gameboy, and GBA emulators.

I don't endorse piracy. Get your ROMs legally.

## Setup

- Create a `config.json` file, with the structure:
  ```json
  {
    "token": "your discord bot token",
    "prefix": "-",
    "speed": "1x"
  }
  ```
  `speed` is one of:
  - `"0.5x"`, `"1x"`, or `"2x"` for speed multipliers
  - `"fast"` waits 1ms between frames
  - `"faster"` uses `setImmediate` between frames
  - `"fastest"` doesn't wait between frames
  
  This is to control CPU usage, so you can balance between CPU consumption and bot delay. If omitted, `"1x"` is the default.
- Create a `roms` folder, and place your ROMs in there.
- Create an `index.json` in that folder as well, with the structure:
  ```json
  {
    "game1": {
      "file": "game1.gb",
      "emulator": "gameboy",
      "initdelay": 1000,
      "delay": 60,
      "pressFrames": 4
    },
    "game2": {
      "file": "game2.nes",
      "emulator": "nes",
      "initdelay": 1000,
      "delay": 60,
      "pressFrames": 4
    },
    "game3": {
      "file": "game2.gba",
      "emulator": "gba",
      "initdelay": 1000,
      "delay": 60,
      "pressFrames": 4
    }
  }
  ```
  - `initdelay` is the number of frames the game takes to start up and get to the title screen or any other preferable interactive state
  - `delay` is the number of frames to advance after each keypress, for example the time it takes your character to walk one tile in Pokemon
  - `pressFrames` is the number of frames to hold down the button for

## Usage

Commands:
- `{prefix}start {game}` - Start or restart a game with the specified name.
- `{prefix}list` - Lists all available games.
- `{prefix}save` - Uploads the current save state.
- `{prefix}load` - Loads the attached save state into the emulator.

When a game is running, buttons can be pressed by sending (case insensitive):
- `a`
- `b`
- `start`
- `select`
- `up` or `^`
- `down` or `v`
- `left` or `<`
- `right` or `>`

The bot can be restricted to one channel only through permissions. Disallow the bot from reading and sending messages globally, and enable those permissions for the bot in only the desired channels.

If the bot has "Manage Messages" permissions, it will delete messages used as input to reduce spam.


## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fnavaneethkm004%2FDiscord-Gamebuay.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fnavaneethkm004%2FDiscord-Gamebuay?ref=badge_large)
