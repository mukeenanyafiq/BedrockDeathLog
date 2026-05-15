import { Player, PlayerPermissionLevel } from "@minecraft/server";
import { getWorldData } from "../index";
import ActionFormHelper from "../helper/ActionFormHelper";
import { deathlogs } from "./deathlogs";

/**
 * @param {Player} player
 */
export function admin(player) {
    if (player.playerPermissionLevel !== PlayerPermissionLevel.Operator) {
        return player.sendMessage("§l[BedrockDeathLog]§r Unauthorized access attempted with user without exact operator-level permission")
    }

    new ActionFormHelper()
    .title("BedrockDeathLog AdminMenu")
    .body("Monitor and manage everything")
    .button("<View all players deathlog>", "", () => adminDeathlogs(player))
    .show(player, true)
}

function adminDeathlogs(player) {
    const access = getWorldData().filter(val => val[0] !== player.id);

    const f = new ActionFormHelper()
    .title("Player Deathlogs")
    .body(
        `There are §l${access.length} other player(s) deathlogs§r\n\n` +
        "Select which one you would like to view"
    )
    .button("<Return>", "", () => admin(player))
    .button(`Your deathlogs\n§l[${player.id}]§r`, "", () => { deathlogs(player, player, 1, () => adminDeathlogs(player), true) })
    for (const pl of access) { f.button(`${pl[1]}\n§l[${pl[2].length} death(s)]§r`, "", () => { deathlogs(player, { name: pl[1], id: pl[0] }, 1, () => adminDeathlogs(player), true) }) }
    f.show(player)
}