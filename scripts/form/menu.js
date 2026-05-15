import { configurations, deathTypes, getData } from "../index"
import ActionFormHelper from "../helper/ActionFormHelper"
import * as configuration from "./configuration"
import * as deathlogs from "./deathlogs"

/**
 * @param {Player} player
 */
export function showForm(player) {
    const playerData = getData(player)[0]
    new ActionFormHelper()
    .title("BedrockDeathLog")
    .body(
        `${player.name}\n§l[${player.id}]§r\n` +
        "==================\n"+
        `Total death: §l${playerData[2].length} death(s)§r\n` +
        (playerData[2].length < 1 ? `You're in a really good state. Keep it up!\n\n` : "\n") +
        `Access mode: §l${(playerData[6] === 0 ? "§2EVERYONE" : "§6ACCESS-ONLY")}§r\n` +
        "Select an action to continue"
    )
    .button("<View Deathlogs>", "textures/ui/heart_half", () => deathlogs.playerDeathlogs(player))
    .button("<Configuration>", "", () => configuration.showForm(player))
    .button("<Death Types>", "", () => {
        const formDeathTypes = new ActionFormHelper()
        .title("List of death types")
        .body(`There are §l${Object.keys(deathTypes).length} death types§r registered`)
        .button("<Return>", "", () => showForm(player))
        for (const deathType in deathTypes) { formDeathTypes.button(`§l"${deathType}"§r\n${deathTypes[deathType]}`, "", () => showForm(player)) }
        formDeathTypes.show(player)
    })
    .button("<Access Settings>", "", () => deathlogs.access(player))
    .show(player)
}