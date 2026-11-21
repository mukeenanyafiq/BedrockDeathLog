import { DeathLogConfig } from "./types"
import MCNumber from "./variables/MCNumber"
import MCRange from "./variables/MCRange"

export const dataId = "bdeathlog:data"

/**
 * A list of configuration variables with their label and type
 */
export const configurations: { [key: string]: [string, boolean | MCRange | MCNumber] } = {
    "logDeath": ["Logs your last death to chat", true],
    "roundDeathPos": ["Rounds the death position (no decimal)", true],
    "fixedDecimal": ["How many decimals in the death position", new MCRange(1, 5, 1)], // 1 - 5 allowed values
    "ascending": ["Ascending", true],
    "showMilliseconds": ["Shows an extra millisecond in your death time", false],
    "msFixed": ["How many decimals in the last death time in milliseconds", new MCRange(1, 3, 1)], // 1 - 3 allowed values
    "useNumberTime": ["Use timestamp instead of date", false],
    "useDimensionId": ["Use dimension Id instead of the dimension name", false],
    "useShortenedCause": ["Use a shortened death cause", false],
    "listPerPage": ["How many deaths per page to be shown (too much may cause lag)", new MCNumber()] // exceeding values might lag
}

/**
 * Default configuration values for player's death log settings.
 */
export const defaultConfig: DeathLogConfig = {
    "logDeath": true,
    "roundDeathPos": true,
    "fixedDecimal": 1,
    "ascending": true,
    "showMilliseconds": false,
    "msFixed": 3,
    "useNumberTime": false,
    "useDimensionId": false,
    "useShortenedCause": false,
    "listPerPage": 10
}

/** Access types for player death log visibility */
export const accessTypes = {
    EVERYONE: 0,
    ACCESS_ONLY: 1
}

/**
 * A list of dimensions with their label and an optional icon for the menu.
 * Custom dimensions may only show their dimension Id instead.
 */
export const dimensions: { [key: string]: [string, string] } = {
    "minecraft:overworld": ["Overworld", "textures/blocks/grass_side_carried"],
    "minecraft:nether": ["Nether", "textures/blocks/netherrack"],
    "minecraft:the_end": ["The End", "textures/blocks/end_stone"],
}

/**
 * A list of death types with their label. The key is the same as the cause provided by the damage source
 */
export const deathTypes: { [key: string]: string } = {
    "anvil": "Squashed by Anvil",
    "blockExplosion": "Explosion from Block",
    "campfire": "Burned in Campfire",
    "charging": "Charged into",
    "contact": "Touching prickly things",
    "drowning": "Drowned",
    "entityAttack": "Attacked by Entity",
    "entityExplosion": "Explosion from Entity",
    "fall": "Fell from a high place",
    "fallingBlock": "Squashed by a falling block",
    "fire": "Burned in fire",
    "fireTick": "Burned over time",
    "fireworks": "Playing fireworks.",
    "flyIntoWall": "Flew into a wall",
    "freezing": "Froze to death",
    "lava": "Burned in lava",
    "lightning": "Struck by Lightning",
    "maceSmash": "One-shotted with a Mace",
    "magic": "Killed with magic",
    "magma": "Standing too long in a magma block",
    "none": "Unknown cause",
    "override": "Overridden health data",
    "piston": "Piston.",
    "projectile": "Shot by a projectile",
    "ramAttack": "Rammed by a goat",
    "selfDestruct": "Self-destructed",
    "sonicBoom": "Sonic boom from big boy",
    "soulCampfire": "Burned in soul campfire",
    "stalactite": "Impaled on stalactite",
    "stalagmite": "Impaled on stalagmite",
    "starve": "Starved to death",
    "suffocation": "Suffocated",
    "temperature": "Died from unstable temperature",
    "thorns": "Killed by thorns",
    "void": "Fell into the Void",
    "wither": "Withered away"
}