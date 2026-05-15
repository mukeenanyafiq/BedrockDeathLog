import { world } from "@minecraft/server"
import { ACCESS_TYPE, dataId, formatDeathCause, formatTime, formatVector3, getAccessableDeathlogs, getData, getDimension, getWorldData } from "../index"
import ActionFormHelper from "../helper/ActionFormHelper"
import ModalFormHelper from "../helper/ModalFormHelper"
import * as menu from "./menu"

// Deathlogs
export function deathlogs(player, targetPlayer, page, callback, operator) {
    if (typeof page !== "number") { page = 1 }

    // Gets the source player's data and the target player's data
    const playerData = getData(player)[0]
    const targetPlayerData = getData(targetPlayer)[0]

    // If the target player is not the same as the source player, check for permissions.
    if (!operator && targetPlayer.id !== player.id && targetPlayerData) {
        if (
            targetPlayerData[6] === ACCESS_TYPE.ACCESS_ONLY && !targetPlayerData[3].includes(player.id) ||
            targetPlayerData[6] === ACCESS_TYPE.EVERYONE && targetPlayerData[4].includes(player.id)
        ) {
            return player.sendMessage("§l[BedrockDeathLog]§r You don't have access to view the deathlogs.")
        }
    }

    // Load the death logs and sort them based on the player's preference, then slice the array to get them based on the current page
    const plDeathlogs = playerData[5].ascending ? targetPlayerData[2].reverse() : targetPlayerData[2]
    const pageCount = Math.ceil(targetPlayerData[2].length / playerData[5].listPerPage)
    const slice = plDeathlogs.slice((page - 1) * playerData[5].listPerPage, page * playerData[5].listPerPage)

    const form = new ActionFormHelper()
    .title(`${targetPlayer.name} deathlogs`)
    .body(
        `${targetPlayer.name}\n§l[${targetPlayer.id}]§r\n\n` +
        (targetPlayerData[2].length < 1 ? `${targetPlayer.id === player.id ? "You" : "They"} haven't even died yet. Nice.` : 
        `Showing page §l${page} §r/§l ${pageCount}§r\n( §l${targetPlayerData[2].length} death(s)§r in total )`)
    )
    .button("<Return>", "", () => callback())
    if (pageCount > page) { form.button("<Next Page>", "", () => deathlogs(player, targetPlayer, page + 1, callback)) }
    if (page > 1) { form.button("<Previous Page>", "", () => deathlogs(player, targetPlayer, page - 1, callback)) }

    slice.forEach((death, i) => {
        const vector = formatVector3(death[1], player)
        form.button(
            `§l${vector}\n` +
            `${formatTime(death[0], player)}`, getDimension(death[2], player)[1], () => {
                const body = `Cause: §l${formatDeathCause(death[3], player)}§r\n` +
                        `Position: ${vector}\n` +
                        `Dimension: §l${getDimension(death[2], player)[0]}§r\n` +
                        `Time happened: §l${formatTime(death[0], player)}§r`

                let extra = body
                if (death.length > 4) {
                    extra += "\n===== Extra Information ====\n" +
                    (death.length === 5 ? `${death[4][0]}: §l${death[4][1]}§r\n` : "") +
                    (death.length === 6 ? `${death[5][0]}: §l${death[5][1]}§r` : "")

                    for (const info of death.splice(4)) {
                        extra += `${info[0]}: §l${info[1]}§r\n`
                    }
                }

                new ActionFormHelper()
                .title(`Death #${i+1}`)
                .body(
                    `Cause: §l${formatDeathCause(death[3], player)}§r\n` +
                    `Position: ${vector}\n` +
                    `Dimension: §l${getDimension(death[2], player)[0]}§r\n` +
                    `Time happened: §l${formatTime(death[0], player)}§r\n` +
                    (death.length > 4 ? "\n===== Extra Information ====\n" : "") +
                    (death.length === 5 ? `${death[4][0]}: §l${death[4][1]}§r\n` : "") +
                    (death.length === 6 ? `${death[5][0]}: §l${death[5][1]}§r` : "")
                )
                .button("<Return>", "", () => deathlogs(player, targetPlayer, page, callback))
                .button("<Print information>\n§lExtra info not included§r", "", () => {
                    player.sendMessage(
                        `Cause: §l${formatDeathCause(death[3], player)}§r\n` +
                        `Position: ${vector}\n` +
                        `Dimension: §l${getDimension(death[2], player)[0]}§r\n` +
                        `Time happened: §l${formatTime(death[0], player)}§r`
                    )
                })
                .show(player)
            })
    });

    form.show(player)
}

// Player deathlogs
export function playerDeathlogs(player) {
    // Gets a list of all accessable deathlogs in the world in the player's perspective. If there's none, directly shows the player's deathlogs.
    const accessable = getAccessableDeathlogs(player)
    if (accessable.length < 1) { return deathlogs(player, player, 1, () => menu.showForm(player)); }

    const form = new ActionFormHelper()
    .title("Player Deathlogs")
    .body(
        `You have access to view §l${accessable.length} other player(s) deathlogs§r\n\n` +
        "Select which one you would like to view"
    )
    .button("<Return>", "", () => menu.showForm(player))
    .button(`Your deathlogs\n§l[${player.id}]§r`, "", () => { deathlogs(player, player, 1, () => playerDeathlogs(player)) })
    for (const pl of accessable) {
        form.button(`${pl[1]}\n§l[${pl[2].length} death(s)]§r`, "", () => { deathlogs(player, { name: pl[1], id: pl[0] }, 1, () => playerDeathlogs(player)) })
    }

    form.show(player)
}

// Access
export function access(player) {
    let playerData = getData(player)[0]
    const openEveryone = playerData[6] === ACCESS_TYPE.EVERYONE

    const form = new ActionFormHelper()
    .title("Access Settings")
    .body(
        "Who can access your deathlog:\n" +
        `§l${(openEveryone ? "Everyone" : "Only those who has access")}§r\n\n` +
        `Total: §l${playerData[openEveryone ? 4 : 3].length} player(s)§r\n` +
        `${(openEveryone ? "Add someone as an exception" : "Give an access to someone to view your deathlog")} or remove one by selecting their name`
    )

    .button("<Return>", "", () => menu.showForm(player))

    // Access mode
    .button(
        "<Change access mode>\n" +
        `§l${(openEveryone ? "§2EVERYONE" : "§6ACCESS-ONLY")}§r`, "", () => {
            const worldData = getWorldData()
            const [playerData, i] = getData(player)

            playerData[6] = ACCESS_TYPE.ACCESS_ONLY - playerData[6]
            worldData[i] = playerData

            world.setDynamicProperty(dataId, JSON.stringify(worldData))
            access(player)
        }
    )

    // Add exception / Add access
    .button(openEveryone ? "<Add an exception>" : "<Give access>", "", () => {
        const filtered = mc.world.getAllPlayers().filter(pl => pl.id !== player.id && !playerData[openEveryone ? 4 : 3].includes(pl.id))
        if (filtered.length < 1) { 
            return player.sendMessage(
                `§l[BedrockDeathLog]§r There's no more players left to be ${openEveryone ? "added to the exception list" : "given the access"}.` +
                (playerData[openEveryone ? 4 : 3].length > 0 ? " You may remove one IF you want." : "")
            );
        }

        new ModalFormHelper()
        .title(openEveryone ? "Add exception" : "Give access")
        .dropdown(
            `Choose a player to be ${(openEveryone ? "added into the exception list\n\n(players who §lCAN'T§r see your deathlog)" : "given access to your deathlog\n\n(players that §lCAN§r see your deathlog)")}`, filtered.map(pl => `${pl.name} §l[${pl.id}]§r`)
        )
        .toggle("<Discard and Return>")
        .submitButton(openEveryone ? "Add the exception" : "Give the access")
        .show(player).then(res => {
            if (res.formValues[res.formValues.length-1]) { return access(player); }
            let worldData = getWorldData()
            let [playerData, i] = getData(player)

            playerData[openEveryone ? 4 : 3].push(filtered[res.formValues[0]].id)
            worldData[i] = playerData
            world.setDynamicProperty(dataId, JSON.stringify(worldData))

            access(player)
        })
    })

    // Gets all players that are given access or added to the exception list
    for (const pl of playerData[openEveryone ? 4 : 3]) {
        const player = getWorldData().find(val => val[0] === Number(pl))
        form.button(
            `${(player && `${player[1]}\n`)}§l[${pl}]§r`, "", () => {
                new MessageFormHelper()
                .title(`Remove ${(player ? player[1] : pl)}?`)
                .body(
                    `Are you sure you want to remove §l${(player ? player[1] : pl)}§r from ${openEveryone ? "the exception list" : "accessing your deathlog"}?\n\n` +
                    "You would have to wait for them to get online if you want to re-add them"
                )
                .button1("Yes", () => {
                    let worldData = getWorldData()
                    let [playerData, i] = getData(player)

                    playerData[openEveryone ? 4 : 3] = playerData[openEveryone ? 4 : 3].filter(dataId => id !== pl)
                    worldData[i] = playerData

                    world.setDynamicProperty(dataId, JSON.stringify(worldData))
                    access(player)
                })
                .button2("No", () => access(player))
                .show(player)
            }
        )
    }

    form.show(player)
}