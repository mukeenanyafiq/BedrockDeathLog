# BedrockDeathLog
> Version supported: v26.0 and above

![Banner](https://github.com/mukeenanyafiq/BedrockDeathLog/blob/main/images/Banner.png)

A Bedrock add-on that logs and saves your last death position in any dimension you're in!
- To start, **the add-on should be installed on your world** (obviously)
- ...and **you need to rename an item first** (like a `Stick` or `Dirt` - your choice) to **`/bdl`**
- Once you've renamed the item, you can then **right-click/hold down the item** to open up the **`BedrockDeathLog`** menu

![Death logs](https://github.com/mukeenanyafiq/BedrockDeathLog/blob/main/images/deathLogs.png)

Let's start with a question first. How is this useful?

- Let's say your friends died in the End City, far away from the home end gate. You can check his deathlog to find the location of where he died and immediately set off for the journey of returning his items back!
- You can also see how he died. *(the controversy begins from this part)* Died in the void? Yeah, **no chance I'm going there.** You tell him the bad news and in the next second he starts up a new world. Neat, huh?

## `BedrockDeathLog` menu

![BedrockDeathLog menu](https://github.com/mukeenanyafiq/BedrockDeathLog/blob/main/images/bedrockDeathLogMenu.png)

- `<View Deathlogs>` - Opens up a list of death a player/you have experienced<br>**(does not includes death happened before the addon was installed)**
- `<Configuration>` - Change your DeathLog experience into your preferences!
- `<Death Types>` - Gives you types of deaths that might/might not happen to you
- `<Access Settings>` - Change your deathlog access type to...<br>`Everyone` **(everyone can see your deathlog)**<br>`Only those who has access` **(certain people you added so they can see your deathlog)**<br>
You can also add/remove a player to an `exception of who can't see your deathlog` or `give them access to your deathlog`

# Installation
- Double-click/Open the **.mcpack** to automatically install the add-on
- *Manual installation:* Unzip the **.zip** file as a folder and move the folder to...<br>
Android: `Android/data/com.mojang.minecraftpe/files/games/com.mojang/behavior_packs`<br>
Windows: `%appdata%\Minecraft Bedrock\Users\Shared\games\com.mojang\behavior_packs`
- Edit your world/Create new world and add **`BedrockDeathLog`** in the Behavior Packs section!

## For Beta API pack version:

- You need to enable Beta APIs Experimental on your world for the pack to work.
- Edit your world or Create a new world

![Hovering edit world button](https://github.com/mukeenanyafiq/BedrockDeathLog/blob/main/images/editWorld.png)

- Go to Experiments

![Experiments tab in Edit World menu](https://github.com/mukeenanyafiq/BedrockDeathLog/blob/main/images/experimentsTabEditWorld.png)

- Enable Beta APIs

![Enabled Beta API in Experiments](https://github.com/mukeenanyafiq/BedrockDeathLog/blob/main/images/enabledBetaAPIExperiment.png)

# DeathLog `scriptevent`
For tech-nerds, there is a way to troubleshoot the add-on, if, somehow the game were bugging/glitching

| Commands | Functions |
| -------- | --------- |
| `/scriptevent bdeathlog:resetall` | Resets all player's data including deathlogs and player's configuration<br>**(NOTICE: ONLY USE WITH CAUTION)** |
| `/scriptevent bdeathlog:debug` | Returns player's `DeathLog` data and logs it in console<br>(Depending on the player, it would **not return** data of a player that don't give you access to their deathlog or player who added you in their exception) |

# Contribution
This add-on originates from my friend that keeps dying in his world and losing his items from despawning at the cost of me and his progress ***(deleting the entire world)***<br>
To prevent more of that, I made this add-on to save his last death position in order for me to recover his items in the nick of time

Still, if you would like to contribute to this add-on and make a change in the add-on, I would gladly appreciate it!
- [Bugs? Report it here!](https://github.com/mukeenanyafiq/BedrockDeathLog/issues/new)
- [Pull request](https://github.com/mukeenanyafiq/BedrockDeathLog/pulls)

Just don't forget to put the add-on in `development_behavior_packs` if you're actively working on changes
