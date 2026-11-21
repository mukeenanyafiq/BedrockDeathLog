import * as mc from "@minecraft/server"
import * as menu from "./form/menu"
import { dimensions, deathTypes, defaultConfig, accessTypes, dataId } from "./constants"
import { Deathlog, DeathLogConfig, HandsDownJustWhatsTakenFromPlayerObject } from "./types"

// Interfaces
// original data interface
const dataInterface = {
    "id": 0,
    "name": "",
    "deaths": [],
    "access": [],
    "exception": [],
    "config": {},
    "accessType": 1
}

// minified data interface to save storage
type MinifiedDataInterface = [number, string, Deathlog[], string[], string[], DeathLogConfig, number]

const minifiedData: MinifiedDataInterface = [
    0, // player id [0]
    "", // player name [1]
    [], // deaths [2]
    [], // access [3]
    [], // exception [4]
    {}, // config [5]
    1 // access type [6] (0 = everyone but with an exception, 1 = access only)
]
    
/** Structure of how the death log data are stored */
const deathlog: Deathlog = [
    0, // timestamp
    { x: 0, y: 0, z: 0 }, // position
    "minecraft:overworld", // dimension
    "unknown", // cause
]

// Local interface functions
/** Merge two objects at surface-level */
function mergeObject(obj1: any, obj2: any): object {
    const merged = { ...obj1 }
    for (const key in obj2) {
        if (obj2[key] !== undefined) { merged[key] = obj2[key] }
    }
    return merged
}

// Global functions
export function getWorldData(): any {
    const data = mc.world.getDynamicProperty(dataId) || "[]"
    if (typeof data == "string") { return JSON.parse(data) }
    return data
}

export function getData(player: mc.Player | HandsDownJustWhatsTakenFromPlayerObject, beautifier = false): [MinifiedDataInterface, number] {
    if (!player) { return [[...minifiedData], -1]; }
    const worldData = getWorldData()
    const i = worldData.findIndex((p: any[]) => p[0] === player.id)

    let playerData = worldData[i]

    if (!playerData) {
        playerData = [ ...minifiedData ]
        playerData[0] = player.id
        playerData[1] = player.name

        worldData.push(playerData)
        mc.world.setDynamicProperty(dataId, JSON.stringify(worldData))
    }

    playerData[5] = mergeObject({ ...defaultConfig }, playerData[5])

    let beautiful: { [key: string]: any } = {}
    if (beautifier) {
        playerData.forEach((v: any, i: number) => { beautiful[Object.keys(playerData)[i]] = v })
    }

    return [beautifier ? beautiful : playerData, i]
}

/**
 * Gets a list of all players accessable deathlogs on the world in the player's perspective.
 * Returns all deathlogs that are open to everyone if the player parameter is not provided
 */
export function getAccessableDeathlogs(player: mc.Player | HandsDownJustWhatsTakenFromPlayerObject | undefined) { 
    const data = getWorldData()
    let id = []

    for (const pl of data) {
        if (player) {
            if (pl[0] !== player.id) {
                if (
                    pl[6] === accessTypes.ACCESS_ONLY && pl[3].includes(player.id) ||
                    pl[6] === accessTypes.EVERYONE && !pl[4].includes(player.id)
                ) id.push(pl)
            }
        } else { 
            if (pl[6] === accessTypes.EVERYONE) id.push(pl)
        }
    }

    return id
}

export function getDimension(dimension: string, player: mc.Player | HandsDownJustWhatsTakenFromPlayerObject | undefined) {
    if (player && getData(player)[0][5].useDimensionId) { return [dimension, dimensions[dimension][1] || ""] }
    return dimensions[dimension] || [dimension, ""]
}

export function formatTime(timestamp: number, player: mc.Player | HandsDownJustWhatsTakenFromPlayerObject | undefined) {
    let showMs = false
    const config = getData(player!)[0][5]

    if (player) {
        if (typeof config.showMilliseconds === "boolean") { showMs = config.showMilliseconds } // use milliseconds according to player's preference
        if (config.useNumberTime) { return timestamp / 1000 } // separate milliseconds as a decimal
    }

    const date = new Date(timestamp)
    function a(x: any) { return `${("0").repeat(2 - x.toString().length)}${x}` }

    return `${a(date.getDate())}/${a(date.getMonth())}/${date.getFullYear()} ` +
    `${a(date.getHours())}:${a(date.getMinutes())}:${a(date.getSeconds())}` +
    `${config.showMilliseconds && "§l."+date.getMilliseconds().toString().substring(0, config.msFixed) || ""}`
}

export function formatVector3(vector: { x: number, y: number, z: number }, player: mc.Player | HandsDownJustWhatsTakenFromPlayerObject | undefined) {
    if (player) {
        const config = getData(player)[0][5]
        const precision = config.fixedDecimal
        vector.x = Number(vector.x.toFixed(precision))
        vector.y = Number(vector.y.toFixed(precision))
        vector.z = Number(vector.z.toFixed(precision))

        if (config.roundDeathPos) {
            vector.x = Math.round(vector.x)
            vector.y = Math.round(vector.y)
            vector.z = Math.round(vector.z)
        }
    }
    return `§4X:§r §6§l${vector.x} §2Y:§r §6§l${vector.y} §1Z:§r §6§l${vector.z}§r`
}

export function formatDeathCause(cause: string, player: mc.Player | HandsDownJustWhatsTakenFromPlayerObject | undefined) {
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
        const [playerData, i] = getData(ev.deadEntity as mc.Player)

        if (i === -1) { return; }

        const death: Deathlog = [ ...deathlog ]
        death[0] = Date.now()
        death[1] = ev.deadEntity.location
        death[2] = ev.deadEntity.dimension.id
        death[3] = ev.damageSource.cause
        if (ev.damageSource.damagingEntity) death[4] = ["Entity", ev.damageSource.damagingEntity.typeId]
        if (ev.damageSource.damagingProjectile) death[death.length < 5 ? 4 : 5] = ["Projectile", ev.damageSource.damagingProjectile.typeId]

        playerData[2].push(death)
        worldData[i] = playerData
        mc.world.setDynamicProperty(dataId, JSON.stringify(worldData))
    }
})

/// player spawns
mc.world.afterEvents.playerSpawn.subscribe(ev => {
    const plData = getData(ev.player)[0]

    // if the player is just respawning, send a message to inform them of their last death
    if (!ev.initialSpawn && plData[5].logDeath) {
        const lastdeath = plData[2][plData[2].length - 1]
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
            ev.sourceType === "Entity" ? "Entity " + (ev.sourceEntity instanceof mc.Player ? ev.sourceEntity?.name : ev.sourceEntity?.typeId) : 
            ev.sourceType === "NPCDialogue" ? "NPC " + ev.initiator?.nameTag : 
            "the server"
            
            mc.world.setDynamicProperty(dataId, "[]")
            mc.world.getAllPlayers().forEach(pl => pl.sendMessage(`§l[BedrockDeathLog]§r All deathlogs data (including yours) were deleted by ${type}`))
        break;

        case "bdeathlog:debug":
            if (ev.sourceEntity?.typeId !== "minecraft:player") { break; }
            let mod = getWorldData()
            let access = getAccessableDeathlogs(ev.sourceEntity as mc.Player)
            mod = mod.filter((v: any) => v[0] === ev.sourceEntity?.id || access.some(pl => pl[0] === v[0]));
            console.log(JSON.stringify(mod))
        break;
    }
})