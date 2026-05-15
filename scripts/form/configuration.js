import { Player, world } from "@minecraft/server";
import { configurations, dataId, getData, getWorldData } from "../index";
import ModalFormHelper from "../helper/ModalFormHelper";
import * as menu from "./menu"
import MCRange from "../variables/MCRange";
import MCNumber from "../variables/MCNumber";

/**
 * @param {Player} player 
 * @param {{}} defaultConfig
 */
export function showForm(player, defaultConfig) {
    const playerData = getData(player)[0];

    const form = new ModalFormHelper()
    .title("Configure DeathLog")
    for (const configVar in defaultConfig || playerData[5]) {
        const tvar = defaultConfig?.[configVar] || playerData[5][configVar]
        const config = configurations[configVar]
        if (typeof tvar === "boolean") {
            form.toggle(config[0], tvar)
        } else {
            if (config[1] instanceof MCRange) { form.slider(config[0], config[1].min, config[1].max, config[1].step, tvar) }
            if (config[1] instanceof MCNumber) { form.textField(config[0], "Number only", tvar.toString()) }
        }
    }

    form.toggle("<Discard and Return>")
    .show(player).then(res => {
        // If the discard and return toggle are checked, return to the menu without saving
        if (res.formValues[res.formValues.length-1]) { return menu.showForm(player); }

        // Save the configuration
        let worldData = getWorldData()
        let [playerData, i] = getData(player)
        let changed = false

        res.formValues.slice(0, -2).forEach((val, i) => {
            const configKey = Object.keys(playerData[5])[i]
            if (configurations[configKey][1] instanceof MCNumber && isNaN(res.formValues[i])) {
                let cloneConfig = { ...playerData[5] }

                res.formValues.forEach((val, i) => cloneConfig[configKey] = val)
                cloneConfig[configKey] = `${val} isn't a number!`
                return configuration.showForm(player, cloneConfig);
            }
            
            if (playerData[5][configKey] !== val) { 
                changed = true
                playerData[5][configKey] = val
            }
        })

        worldData[i] = playerData
        if (changed) { player.sendMessage("§l[BedrockDeathLog]§r Configuration changed") }
        world.setDynamicProperty(dataId, JSON.stringify(worldData))

        menu.showForm(player)
    })
}