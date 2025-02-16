import * as mc from "@minecraft/server"
import { ModalFormData } from "@minecraft/server-ui"
import ActionFormHelper from "./helper/ActionFormHelper"
import MessageFormHelper from "./helper/MessageFormHelper"
import MCRange from "./variables/MCRange"
import MCNumber from "./variables/MCNumber"

const id = "bdeathlog:data"
const data = {
    "id": 0,
    "name": "",
    "deaths": [],
    "access": [],
    "exception": [],
    "config": {},
    "accessType": 1
}

const mdata = [
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

const config = {
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

const deathlog = [
    0, // timestamp
    { x: 0, y: 0, z: 0 }, // position
    "minecraft:overworld", // dimension
    "unknown", // cause
]

const dimensions = {
    "minecraft:overworld": ["Overworld", "textures/blocks/grass_side_carried"],
    "minecraft:nether": ["Nether", "textures/blocks/netherrack"],
    "minecraft:the_end": ["The End", "textures/blocks/end_stone"],
}

const deathType = {
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
    "flyIntoWall": "Flew into a wall",
    "freezing": "Froze to death",
    "lava": "Burned in lava",
    "lightning": "Struck by Lightning",
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

// global function
function getWorldData() { return JSON.parse(mc.world.getDynamicProperty(id)) }

/**
 * @returns `[pdata, i]`
 */
function getData(player, beautifier) { 
    let wdata = getWorldData()
    let i = wdata.findIndex(p => p[0] == player.id)
    let pdata = wdata[i]
    if (!pdata) {
        pdata = [ ...mdata ]
        pdata[0] = player.id
        pdata[1] = player.name
        wdata.push(pdata)
        mc.world.setDynamicProperty(id, JSON.stringify(wdata))
    }

    let pbdata = {}
    pdata.forEach((v, i) => { pbdata[Object.keys(data)[i]] = v })

    return [beautifier ? pbdata : pdata, i]
}

function getAccessableDeathlog(player) { 
    const data = getWorldData()
    let id = []
    for (const pl of data) {
        if (player) {
            if (pl[0] != player.id) { 
                if (pl[3].includes(player.id) || !pl[4].includes(player.id) && pl[6] == 0) id.push(pl) 
            }
        } else { if (pl[6] == 0) id.push(pl) }
    }
    return id
}

function getDimension(dimension, player) {
    if (player && getData(player)[0][5].useDimensionId) { return [dimension, dimensions[dimension][1] || ""] }
    return dimensions[dimension] || [dimension, ""]
}

function formatTime(timestamp, player) {
    let showMs = false
    if (player) {
        if (typeof getData(player)[0][5].showMilliseconds == "boolean") { showMs = getData(player)[0][5].showMilliseconds } // use milliseconds according to player's preference
        if (getData(player)[0][5].useNumberTime) { return timestamp / 1000 } // separate milliseconds as a decimal
    }
    const date = new Date(timestamp)
    function a(x) { return `${("0").repeat(2 - x.toString().length)}${x}` }
    return `${a(date.getDate())}/${a(date.getMonth())}/${date.getFullYear()} ` +
    `${a(date.getHours())}:${a(date.getMinutes())}:${a(date.getSeconds())}` +
    `${getData(player)[0][5].showMilliseconds && "§l."+date.getMilliseconds().toString().substring(0, getData(player)[0][5].msFixed) || ""}`
}

function formatVector3(vector, player) {
    if (player) {
        for (const v in vector) { vector[v] = vector[v].toFixed(getData(player)[0][5].fixedDecimal) }
        if (getData(player)[0][5].roundDeathPos) { for (const v in vector) vector[v] = Math.round(vector[v]) }
    }
    return `§4X:§r §6§l${vector.x} §2Y:§r §6§l${vector.y} §1Z:§r §6§l${vector.z}§r`
}

function formatDeathCause(cause, player) {
    if (player && getData(player)[0][5].useShortenedCause) { return cause }
    return deathType[cause]
}

// event handling
/// world initialize
mc.world.afterEvents.worldInitialize.subscribe(() => {
    if (!mc.world.getDynamicProperty(id)) mc.world.setDynamicProperty(id, "[]")
})

/// player dies
mc.world.afterEvents.entityDie.subscribe(ev => {
    if (ev.deadEntity.typeId == "minecraft:player") {
        let wdata = getWorldData()
        const [pdata, i] = getData(ev.deadEntity)
        const death = [ ...deathlog ]
        death[0] = Date.now()
        death[1] = ev.deadEntity.location
        death[2] = ev.deadEntity.dimension.id
        death[3] = ev.damageSource.cause
        if (ev.damageSource.damagingEntity) death[4] = ["Entity", ev.damageSource.damagingEntity.typeId]
        if (ev.damageSource.damagingProjectile) death[death.length] = ["Projectile", ev.damageSource.damagingProjectile.typeId]

        pdata[2].push(death)
        wdata[i] = pdata
        mc.world.setDynamicProperty(id, JSON.stringify(wdata))
    }
})

/// player spawns
mc.world.afterEvents.playerSpawn.subscribe(ev => {
    // if the player is just respawning, send a message to inform them of their last death
    if (!ev.initialSpawn && getData(ev.player)[0][5].logDeath) {
        const lastdeath = getData(ev.player)[0][2][getData(ev.player)[0][2].length-1]
        ev.player.sendMessage(
            `Your last death was at ${formatVector3(lastdeath[1], ev.player)}`
        )
    }
})

// Open menu
mc.world.beforeEvents.itemUse.subscribe(ev => {
    // Any item with a "/bdl" name renamed from Anvil or other things
    if (ev.itemStack.nameTag?.toLowerCase() == "/bdl") {
        // Cancel the item's original behavior to prevent any accidental usage
        ev.cancel = true;

        // Menu
        function menu() {
            const pdata = getData(ev.source)[0]
            new ActionFormHelper()
            .title("BedrockDeathLog")
            .body(
                `${ev.source.name}\n§l[${ev.source.id}]§r\n` +
                "==================\n"+
                `Total death: §l${pdata[2].length} death(s)§r\n` +
                (pdata[2].length < 1 ? `You're in a really good state. Keep it up!\n\n` : "\n") +
                `Access mode: §l${(pdata[6] == 0 ? "§2EVERYONE" : "§6ACCESS-ONLY")}§r\n` +
                "Select an action to continue"
            )
            .button("<View Deathlogs>", "textures/ui/heart_half", () => playerDeathlogs())
            .button("<Configuration>", "", () => {
                function conF(def) {
                    const f = new ModalFormData()
                    .title("Configure DeathLog")
                    for (const cvar in def || pdata[5]) {
                        const tvar = def?.[cvar] || pdata[5][cvar]
                        const conf = config[cvar]
                        switch (typeof tvar) {
                            case "boolean":
                                f.toggle(conf[0], tvar)
                            break;
    
                            default:
                                if (conf[1] instanceof MCRange) { f.slider(conf[0], conf[1].min, conf[1].max, conf[1].step, tvar) }
                                if (conf[1] instanceof MCNumber) { f.textField(conf[0], "Number only", tvar.toString()) }
                            break;
                        }
                    }
                    f.toggle("<Discard and Return>")
                    .show(ev.source).then(res => {
                        if (res.canceled) { return; }
                        if (res.formValues[res.formValues.length-1]) { menu(); return }
    
                        let wdata = getWorldData()
                        let [pdata, i] = getData(ev.source)
                        let changed = false
                        res.formValues.slice(0, -2).forEach((val, i) => {
                            if (config[Object.keys(pdata[5])[i]][1] instanceof MCNumber && Number.isNaN(Number(res.formValues[i]))) {
                                let mod = { ...pdata[5] }
                                res.formValues.forEach((val, i) => mod[Object.keys(mod)[i]] = val)
                                mod[Object.keys(mod)[i]] = `${val} isn't a number!`
                                conF(mod)
                                return;
                            }
                            
                            if (pdata[5][Object.keys(pdata[5])[i]] != val) { 
                                changed = true 
                                pdata[5][Object.keys(pdata[5])[i]] = val
                            }
                        })
    
                        wdata[i] = pdata
                        if (changed) { ev.source.sendMessage("§l[BedrockDeathLog]§r Configuration changed") }
                        mc.world.setDynamicProperty(id, JSON.stringify(wdata))
                        menu()
                    })
                }

                conF()
            })
            .button("<Death Types>", "", () => {
                const f = new ActionFormHelper()
                .title("List of death types")
                .body(`There are §l${Object.keys(deathType).length} death types§r registered`)
                .button("<Return>", "", () => menu())
                for (const dt in deathType) { f.button(`§l"${dt}"§r\n${deathType[dt]}`, "", () => menu()) }
                f.show(ev.source)
            })
            .button("<Access Settings>", "", () => access())
            .show(ev.source)
        }

        // Player deathlogs
        function playerDeathlogs() {
            const access = getAccessableDeathlog(ev.source)
            if (access.length < 1) { deathlogs(ev.source, 1, () => menu()); return }
            const f = new ActionFormHelper()
            .title("Player Deathlogs")
            .body(
                `You have access to view §l${access.length} other player(s) deathlogs§r\n\n` +
                "Select which one you would like to view"
            )
            .button("<Return>", "", () => menu())
            .button(`Your deathlogs\n§l[${ev.source.id}]§r`, "", () => { deathlogs(ev.source, 1, () => playerDeathlogs()) })
            for (const pl of access) { f.button(`${pl[1]}\n§l[${pl[0]}]§r`, "", () => { deathlogs({ name: pl[1], id: pl[0] }, 1, () => playerDeathlogs()) }) }
            f.show(ev.source)
        }

        // Deathlogs
        function deathlogs(player, page, callback) {
            const pdata = getData(player)[0]
            if (player.id != ev.source.id && pdata) {
                if (pdata[6] == 1 && !pdata[3].includes(ev.source.id) || pdata[6] == 0 && pdata[4].includes(ev.source.id)) {
                    ev.source.sendMessage("§l[BedrockDeathLog]§r You don't have access to view the deathlogs.")
                    return
                }
            }

            const psdata = pdata[5].ascending ? pdata[2].reverse() : pdata[2]
            const pagecount = Math.ceil(pdata[2].length / pdata[5].listPerPage)
            const slice = psdata.slice((page-1) * pdata[5].listPerPage, page * pdata[5].listPerPage)

            const f = new ActionFormHelper()
            .title(`${player.name} Deathlogs`)
            .body(
                (pdata[2].length < 1 ? `${player.id != ev.source.id ? "They" : "You"} haven't even died yet. Nice.` : 
                    `Showing page §l${page} §r/§l ${pagecount}§r\n( §l${pdata[2].length} death(s)§r in total )`
                )
            )
            .button("<Return>", "", () => callback())
            if (pagecount > page) { f.button("<Next Page>", "", () => deathlogs(player, page+1, callback)) }
            if (page > 1) { f.button("<Previous Page>", "", () => deathlogs(player, page-1, callback)) }
            slice.forEach((death, i) => {
                const vector = formatVector3(death[1], ev.source)
                f.button(
                    `§l${vector}\n` +
                    `${formatTime(death[0], ev.source)}`, getDimension(death[2], ev.source)[1], () => {
                        new ActionFormHelper()
                        .title(`Death #${i+1}`)
                        .body(
                            `Cause: §l${formatDeathCause(death[3], ev.source)}§r\n` +
                            `Position: ${vector}\n` +
                            `Dimension: §l${getDimension(death[2], ev.source)[0]}§r\n` +
                            `Time happened: §l${formatTime(death[0], ev.source)}§r\n` +
                            (death.length > 4 ? "===== Extra Information ====\n" : "") +
                            (death.length == 5 ? `${death[4][0]}: §l${death[4][1]}§r\n` : "") +
                            (death.length == 6 ? `${death[5][0]}: §l${death[5][1]}§r` : "")
                        )
                        .button("<Return>", "", () => deathlogs(player, page, callback))
                        .button("<Print information>\n§lExtra info not included§r", "", () => {
                            ev.source.sendMessage(
                                `Cause: §l${formatDeathCause(death[3], ev.source)}§r\n` +
                                `Position: ${vector}\n` +
                                `Dimension: §l${getDimension(death[2], ev.source)[0]}§r\n` +
                                `Time happened: §l${formatTime(death[0], ev.source)}§r`
                            )
                        })
                        .show(ev.source)
                    })
            });
            f.show(ev.source)
        }

        // Access
        function access() {
            const pdata = getData(ev.source)[0]

            const f = new ActionFormHelper()
            .title("Access Settings")
            .body(
                "Who can access your deathlog:\n" +
                `§l${(pdata[6] == 0 ? "Everyone" : "Only those who has access")}§r\n\n` +
                `Total: §l${pdata[pdata[6] == 0 ? 4 : 3].length} player(s)§r\n` +
                `${(pdata[6] == 0 ? "Add someone as an exception" : "Give an access to someone to view your deathlog")} or remove one by selecting their name`
            )
            .button("<Return>", "", () => menu())
            .button(
                "<Change access mode>\n" +
                `§l${(pdata[6] == 0 ? "§2EVERYONE" : "§6ACCESS-ONLY")}§r`, "", () => {
                    let wdata = getWorldData()
                    let [pdata, i] = getData(ev.source)
                    pdata[6] = 1 - pdata[6]
                    wdata[i] = pdata
                    mc.world.setDynamicProperty(id, JSON.stringify(wdata))
                    access()
                }
            )
            .button(pdata[6] == 0 ? "<Add an exception>" : "<Give access>", "", () => {
                const filtered = mc.world.getAllPlayers().filter(pl => pl.id != ev.source.id && !pdata[pdata[6] == 0 ? 4 : 3].includes(pl.id))
                if (filtered.length < 1) { 
                    ev.source.sendMessage(
                        `§l[BedrockDeathLog]§r There's no more players left to be ${pdata[6] == 0 ? "added to the exception list" : "given the access"}.` +
                        (pdata[pdata[6] == 0 ? 4 : 3].length > 0 ? " You may remove one IF you want." : "")
                    ); 
                    return 
                }

                new ModalFormData()
                .title(pdata[6] == 0 ? "Add exception" : "Give access")
                .dropdown(
                    `Choose a player to be ${(pdata[6] == 0 ? "added into the exception list\n\n(players who §lCAN'T§r see your deathlog)" : "given access to your deathlog\n\n(players who §lCAN§r see your deathlog)")}`, filtered.map(pl => `${pl.name} §l[${pl.id}]§r`)
                )
                .toggle("<Discard and Return>")
                .submitButton(pdata[6] == 0 ? "Add the exception" : "Give the access")
                .show(ev.source).then(res => {
                    if (res.canceled) { return; }
                    if (res.formValues[res.formValues.length-1]) { access(); return }
                    let wdata = getWorldData()
                    let [pdata, i] = getData(ev.source)
                    pdata[pdata[6] == 0 ? 4 : 3].push(filtered[res.formValues[0]].id)
                    wdata[i] = pdata
                    mc.world.setDynamicProperty(id, JSON.stringify(wdata))
                    access()
                })
            })

            for (const pl of pdata[pdata[6] == 0 ? 4 : 3]) {
                const player = getWorldData().find(val => val[0] == Number(pl))
                f.button(
                    `${(player && `${player[1]}\n`)}§l[${pl}]§r`, "", () => {
                        new MessageFormHelper()
                        .title(`Remove ${(player ? player[1] : pl)}?`)
                        .body(
                            `Are you sure you want to remove §l${(player ? player[1] : pl)}§r from ${pdata[6] == 0 ? "the exception list" : "accessing your deathlog"}?\n\n` +
                            "You would have to wait for them to get online if you want to re-add them"
                        )
                        .button1("Yes", () => {
                            let wdata = getWorldData()
                            let [pdata, i] = getData(ev.source)
                            pdata[pdata[6] == 0 ? 4 : 3] = pdata[pdata[6] == 0 ? 4 : 3].filter(id => id != pl)
                            wdata[i] = pdata
                            mc.world.setDynamicProperty(id, JSON.stringify(wdata))
                            access()
                        })
                        .button2("No", () => access())
                        .show(ev.source)
                    }
                )
            }
            f.show(ev.source)
        }

        menu()
    }
})

// Custom set scriptevent
mc.system.afterEvents.scriptEventReceive.subscribe(ev => {
    switch (ev.id) {
        case "bdeathlog:resetall":
            const type = 
            ev.sourceType == "Block" ? "Block " + ev.sourceBlock : 
            ev.sourceType == "Entity" ? "Entity " + ev.sourceEntity.name : 
            ev.sourceType == "NPCDialogue" ? "NPC " + ev.initiator.nameTag : 
            "the server"
            
            mc.world.setDynamicProperty(id, "[]")
            mc.world.getAllPlayers().forEach(pl => pl.sendMessage(`§l[BedrockDeathLog]§r All deathlogs data (including yours) were deleted by ${type}`))
        break;

        case "bdeathlog:debug":
            let mod = getWorldData()
            let access = getAccessableDeathlog(ev.sourceEntity)
            mod = mod.filter(val => val[0] == ev.sourceEntity?.id || access.some(pl => pl[0] == val[0]));
            console.log(JSON.stringify(mod))
        break;
    }
})