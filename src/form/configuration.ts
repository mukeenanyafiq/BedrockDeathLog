import { Player, world } from "@minecraft/server";
import { DeathLogConfig } from "../types";
import { dataId, configurations } from "../constants";
import { getData, getWorldData } from "../index";
import ModalFormHelper from "../helper/ModalFormHelper";
import * as menu from "./menu"
import MCRange from "../variables/MCRange";
import MCNumber from "../variables/MCNumber";

export function showForm(player: Player, defaultConfig: { [key: string]: any } = {}) {
    const [playerData, i] = getData(player);
    if (i === -1) return;

    const plConfig: any = playerData[5]

    const form = new ModalFormHelper()
    .title("Configure DeathLog")
    for (const configVar in (defaultConfig || plConfig)) {
        const tvar = defaultConfig?.[configVar] || plConfig[configVar]
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
        if (!res.formValues) { return; }
        if (res.formValues[res.formValues.length-1]) { return menu.showForm(player); }

        // Save the configuration
        let worldData = getWorldData()
        let [playerData, i] = getData(player)
        let changed = false

        res.formValues.slice(0, -2).forEach((val, i, formValues) => {
            const plConfig: DeathLogConfig | any = playerData[5]
            const configKey = Object.keys(plConfig)[i]
            if (configurations[configKey][1] instanceof MCNumber && (typeof formValues[i] !== "number" || isNaN(formValues[i]))) {
                let cloneConfig: { [key: string]: any } = { ...playerData[5] }

                formValues.forEach((val, i) => cloneConfig[configKey] = val)
                cloneConfig[configKey] = `${val} isn't a number!`
                return showForm(player, cloneConfig);
            }
            
            if (plConfig[configKey] !== val) { 
                changed = true
                plConfig[configKey] = val
            }
        })

        worldData[i] = playerData
        if (changed) { player.sendMessage("§l[BedrockDeathLog]§r Configuration changed") }
        world.setDynamicProperty(dataId, JSON.stringify(worldData))

        menu.showForm(player)
    })
}