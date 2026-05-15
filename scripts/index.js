import * as mc from "@minecraft/server"
import { ModalFormData } from "@minecraft/server-ui"
import ActionFormHelper from "./helper/ActionFormHelper"
import MessageFormHelper from "./helper/MessageFormHelper"
import MCRange from "./variables/MCRange"
import MCNumber from "./variables/MCNumber"
import * as menu from "./form/menu"

// Interfaces
export const dataId = "bdeathlog:data"
const dataInteface = {
    "id": 0,
    "name": "",
    "deaths": [],
    "access": [],
    "exception": [],
    "config": {},
    "accessType": 1
}

const minifiedData = [
    0, // player id [0]
    "", // player name [1]
    [], // deaths [2]
    [], // access [3]
    [], // exception [4]
    { // config [5]
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
    },
    1 // access type (0 = everyone but with an exception, 1 = access only) [6]
]

/**
 * Structure of how the death log are stored
 */
const deathlog = [
    0, // timestamp
    { x: 0, y: 0, z: 0 }, // position
    "minecraft:overworld", // dimension
    "unknown", // cause
]

// Enumerations
export const ACCESS_TYPE = {
    EVERYONE: 0,
    ACCESS_ONLY: 1
}

// Constants
/**
 * A list of configuration variables with their label and type
 * @type { [key: string]: [string, boolean|MCRange|MCNumber] }
 */
export const configurations = {
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
 * A list of dimensions with their label and an optional icon for the menu.
 * 
 * Custom dimensions may only show their dimension Id instead.
 */
export const dimensions = {
    "minecraft:overworld": ["Overworld", "textures/blocks/grass_side_carried"],
    "minecraft:nether": ["Nether", "textures/blocks/netherrack"],
    "minecraft:the_end": ["The End", "textures/blocks/end_stone"],
}

/**
 * A list of death types with their label. The key is the same as the cause provided by the damage source
 */
export const deathTypes = {
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
    "suicide": "Took their own life",
    "temperature": "Died from unstable temperature",
    "thorns": "Killed by thorns",
    "void": "Fell into the Void",
    "wither": "Withered away"
}

// Global functions
/**
 * @returns {object}
 */
export function getWorldData() {
    return JSON.parse(mc.world.getDynamicProperty(dataId) || "[]")
}

/**
 * @returns {[[number, string, [], [], [], {}, number], number]}
 */
export function getData(player, beautifier) { 
    const worldData = getWorldData()
    const i = worldData.findIndex(p => p[0] === player.id)

    let playerData = worldData[i]

    if (!playerData) {
        playerData = [ ...minifiedData ]
        playerData[0] = player.id
        playerData[1] = player.name

        worldData.push(playerData)
        mc.world.setDynamicProperty(dataId, JSON.stringify(worldData))
    }

    let beautiful = {}

    if (beautifier) { playerData.forEach((v, i) => { beautiful[Object.keys(playerData)[i]] = v }) }

    return [beautifier ? beautiful : playerData, i]
}

/**
 * Gets a list of all players accessable deathlogs on the world in the player's perspective.
 * Returns all deathlogs that are open to everyone if the player parameter is not provided
 * @param {Player?} player
 */
export function getAccessableDeathlogs(player) { 
    const data = getWorldData()
    let id = []

    for (const pl of data) {
        if (player) {
            if (pl[0] !== player.id) {
                if (
                    pl[6] === ACCESS_TYPE.ACCESS_ONLY && pl[3].includes(player.id) ||
                    pl[6] === ACCESS_TYPE.EVERYONE && !pl[4].includes(player.id)
                ) id.push(pl)
            }
        } else { 
            if (pl[6] === ACCESS_TYPE.EVERYONE) id.push(pl)
        }
    }

    return id
}

export function getDimension(dimension, player) {
    if (player && getData(player)[0][5].useDimensionId) { return [dimension, dimensions[dimension][1] || ""] }
    return dimensions[dimension] || [dimension, ""]
}

export function formatTime(timestamp, player) {
    let showMs = false
    if (player) {
        if (typeof getData(player)[0][5].showMilliseconds === "boolean") { showMs = getData(player)[0][5].showMilliseconds } // use milliseconds according to player's preference
        if (getData(player)[0][5].useNumberTime) { return timestamp / 1000 } // separate milliseconds as a decimal
    }
    const date = new Date(timestamp)
    function a(x) { return `${("0").repeat(2 - x.toString().length)}${x}` }
    return `${a(date.getDate())}/${a(date.getMonth())}/${date.getFullYear()} ` +
    `${a(date.getHours())}:${a(date.getMinutes())}:${a(date.getSeconds())}` +
    `${getData(player)[0][5].showMilliseconds && "§l."+date.getMilliseconds().toString().substring(0, getData(player)[0][5].msFixed) || ""}`
}

export function formatVector3(vector, player) {
    if (player) {
        for (const v in vector) { vector[v] = vector[v].toFixed(getData(player)[0][5].fixedDecimal) }
        if (getData(player)[0][5].roundDeathPos) { for (const v in vector) vector[v] = Math.round(vector[v]) }
    }
    return `§4X:§r §6§l${vector.x} §2Y:§r §6§l${vector.y} §1Z:§r §6§l${vector.z}§r`
}

export function formatDeathCause(cause, player) {
    if (player && getData(player)[0][5].useShortenedCause) { return cause }
    return deathTypes[cause]
}

mc.system.run(() => {
    if (!mc.world.getDynamicProperty(dataId)) mc.world.setDynamicProperty(dataId, "[]")
});

// event handling
/// system startup

/// player dies
mc.world.afterEvents.entityDie.subscribe(ev => {
    if (ev.deadEntity.typeId === "minecraft:player") {
        const worldData = getWorldData()
        const [playerData, i] = getData(ev.deadEntity)

        const death = [ ...deathlog ]
        death[0] = Date.now()
        death[1] = ev.deadEntity.location
        death[2] = ev.deadEntity.dimension.id
        death[3] = ev.damageSource.cause
        if (ev.damageSource.damagingEntity) death[4] = ["Entity", ev.damageSource.damagingEntity.typeId]
        if (ev.damageSource.damagingProjectile) death[death.length] = ["Projectile", ev.damageSource.damagingProjectile.typeId]

        playerData[2].push(death)
        worldData[i] = playerData
        mc.world.setDynamicProperty(dataId, JSON.stringify(worldData))
    }
})

/// player spawns
mc.world.afterEvents.playerSpawn.subscribe(ev => {
    // if the player is just respawning, send a message to inform them of their last death
    if (!ev.initialSpawn && getData(ev.player)[0][5].logDeath) {
        const lastdeath = getData(ev.player)[0][2][getData(ev.player)[0][2].length-1]
        ev.player.sendMessage(`Your last death was at ${formatVector3(lastdeath[1], ev.player)} (${getDimension(lastdeath[2], ev.player)[0]})`)
    }
})

// Open menu
mc.world.beforeEvents.itemUse.subscribe(ev => {
    // Any item with a "/bdl" name renamed from Anvil or other things
    if (ev.itemStack.nameTag?.toLowerCase() !== "/bdl") { return; }

    // Cancel the item's original behavior to prevent any accidental usage
    ev.cancel = true;

    // Open the menu form
    menu.showForm(ev.source);
})

// Custom set scriptevent
mc.system.afterEvents.scriptEventReceive.subscribe(ev => {
    switch (ev.id) {
        case "bdeathlog:resetall":
            const type = 
            ev.sourceType === "Block" ? "Block " + ev.sourceBlock : 
            ev.sourceType === "Entity" ? "Entity " + ev.sourceEntity.name : 
            ev.sourceType === "NPCDialogue" ? "NPC " + ev.initiator.nameTag : 
            "the server"
            
            mc.world.setDynamicProperty(dataId, "[]")
            mc.world.getAllPlayers().forEach(pl => pl.sendMessage(`§l[BedrockDeathLog]§r All deathlogs data (including yours) were deleted by ${type}`))
        break;

        case "bdeathlog:debug":
            let mod = getWorldData()
            let access = getAccessableDeathlog(ev.sourceEntity)
            mod = mod.filter(val => val[0] === ev.sourceEntity?.id || access.some(pl => pl[0] === val[0]));
            console.log(JSON.stringify(mod))
        break;
    }
})