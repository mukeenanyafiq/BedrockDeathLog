import { ModalFormData } from "@minecraft/server-ui"
import { getWorldData, getData, getAccessableDeathlog, getDimension, formatDeathCause, formatTime, formatVector3, deathType, config } from "./index"
import ActionFormHelper from "./helper/ActionFormHelper"
import MCNumber from "./variables/MCNumber"
import MCRange from "./variables/MCRange"

export function menu(player) {
    const pdata = getData(player)[0]
    new ActionFormHelper()
    .title("BedrockDeathLog")
    .body(
        `${player.name}\n§l[${player.id}]§r\n` +
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
            .show(player).then(res => {
                if (res.canceled) { return; }
                if (res.formValues[res.formValues.length-1]) { menu(); return }

                let wdata = getWorldData()
                let [pdata, i] = getData(player)
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
                if (changed) { player.sendMessage("§l[BedrockDeathLog]§r Configuration changed") }
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
        f.show(player)
    })
    .button("<Access Settings>", "", () => access())
    .show(player)
}

// Player deathlogs
export function playerDeathlogs(player) {
    const access = getAccessableDeathlog(player)
    if (access.length < 1) { deathlogs(player, player, 1, () => menu()); return }
    const f = new ActionFormHelper()
    .title("Player Deathlogs")
    .body(
        `You have access to view §l${access.length} other player(s) deathlogs§r\n\n` +
        "Select which one you would like to view"
    )
    .button("<Return>", "", () => menu())
    .button(`Your deathlogs\n§l[${player.id}]§r`, "", () => { deathlogs(player, player, 1, () => playerDeathlogs()) })
    for (const pl of access) { f.button(`${pl[1]}\n§l[${pl[0]}]§r`, "", () => { deathlogs(player, { name: pl[1], id: pl[0] }, 1, () => playerDeathlogs()) }) }
    f.show(player)
}

// Deathlogs
export function deathlogs(player, target, page, callback) {
    const pdata = getData(player)[0]
    if (player.id != target.id && pdata) {
        if (pdata[6] == 1 && !pdata[3].includes(player.id) || pdata[6] == 0 && pdata[4].includes(player.id)) {
            player.sendMessage("§l[BedrockDeathLog]§r You don't have access to view the deathlogs.")
            return
        }
    }

    const psdata = pdata[5].ascending ? pdata[2].reverse() : pdata[2]
    const pagecount = Math.ceil(pdata[2].length / pdata[5].listPerPage)
    const slice = psdata.slice((page-1) * pdata[5].listPerPage, page * pdata[5].listPerPage)

    const f = new ActionFormHelper()
    .title(`${target.name} Deathlogs`)
    .body(
        (pdata[2].length < 1 ? `${player.id != target.id ? "They" : "You"} haven't even died yet. Nice.` : 
            `Showing page §l${page} §r/§l ${pagecount}§r\n( §l${pdata[2].length} death(s)§r in total )`
        )
    )
    .button("<Return>", "", () => callback())
    if (pagecount > page) { f.button("<Next Page>", "", () => deathlogs(player, target, page+1, callback)) }
    if (page > 1) { f.button("<Previous Page>", "", () => deathlogs(player, target, page-1, callback)) }
    slice.forEach((death, i) => {
        const vector = formatVector3(death[1], player)
        f.button(
            `§l${vector}\n` +
            `${formatTime(death[0], player)}`, getDimension(death[2], player)[1], () => {
                new ActionFormHelper()
                .title(`Death #${i+1}`)
                .body(
                    `Cause: §l${formatDeathCause(death[3], player)}§r\n` +
                    `Position: ${vector}\n` +
                    `Dimension: §l${getDimension(death[2], player)[0]}§r\n` +
                    `Time happened: §l${formatTime(death[0], player)}§r\n` +
                    (death.length > 4 ? "\n===== Extra Information ====\n" : "") +
                    (death.length == 5 ? `${death[4][0]}: §l${death[4][1]}§r\n` : "") +
                    (death.length == 6 ? `${death[5][0]}: §l${death[5][1]}§r` : "")
                )
                .button("<Return>", "", () => deathlogs(player, target, page, callback))
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
    f.show(player)
}

// Access
function access(player) {
    const pdata = getData(player)[0]

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
            let [pdata, i] = getData(player)
            pdata[6] = 1 - pdata[6]
            wdata[i] = pdata
            mc.world.setDynamicProperty(id, JSON.stringify(wdata))
            access()
        }
    )
    .button(pdata[6] == 0 ? "<Add an exception>" : "<Give access>", "", () => {
        const filtered = mc.world.getAllPlayers().filter(pl => pl.id != player.id && !pdata[pdata[6] == 0 ? 4 : 3].includes(pl.id))
        if (filtered.length < 1) { 
            player.sendMessage(
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
        .show(player).then(res => {
            if (res.canceled) { return; }
            if (res.formValues[res.formValues.length-1]) { access(); return }
            let wdata = getWorldData()
            let [pdata, i] = getData(player)
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
                    let [pdata, i] = getData(player)
                    pdata[pdata[6] == 0 ? 4 : 3] = pdata[pdata[6] == 0 ? 4 : 3].filter(id => id != pl)
                    wdata[i] = pdata
                    mc.world.setDynamicProperty(id, JSON.stringify(wdata))
                    access()
                })
                .button2("No", () => access())
                .show(player)
            }
        )
    }
    f.show(player)
}

export function admin(player) {
    if (!player.isOp()) { return player.sendMessage("§l[BedrockDeathLog]§r Unauthorized access attemption with no operator-level permission") }

    const f = new ActionFormHelper()
    .title("BedrockDeathLog AdminMenu")
    .body("Monitor and manage everything")
    .button("<View all players deathlog>", "", () => {
        const access = getWorldData()
        if (access.length < 1) { return player.sendMessage("§l[BedrockDeathLog]§r No... thing? We can't find a single player's data.") }
        const f = new ActionFormHelper()
        .title("Player Deathlogs")
        .body(
            `You have access to view §l${access.length} other player(s) deathlogs§r\n\n` +
            "Select which one you would like to view"
        )
        .button("<Return>", "", () => menu())
        .button(`Your deathlogs\n§l[${player.id}]§r`, "", () => { deathlog(player, 1) })
        for (const pl of access) { f.button(`${pl[1]}\n§l[${pl[0]}]§r`, "", () => { deathlogs({ name: pl[1], id: pl[0] }, 1) }) }
        f.show(player)
    })
    .show(player)

    function deathlog(target, page) {
        const pdata = getData(target)[0]
        const psdata = pdata[5].ascending ? pdata[2].reverse() : pdata[2]
        const pagecount = Math.ceil(pdata[2].length / pdata[5].listPerPage)
        const slice = psdata.slice((page-1) * pdata[5].listPerPage, page * pdata[5].listPerPage)
    
        const f = new ActionFormHelper()
        .title(`${target.name} Deathlogs`)
        .body(
            (pdata[2].length < 1 ? `${player.id != target.id ? "They" : "You"} haven't even died yet. Nice.` : 
                `Showing page §l${page} §r/§l ${pagecount}§r\n( §l${pdata[2].length} death(s)§r in total )`
            )
        )
        .button("<Return>", "", () => { f.show(player) })
        if (pagecount > page) { f.button("<Next Page>", "", () => deathlog(target, page+1)) }
        if (page > 1) { f.button("<Previous Page>", "", () => deathlog(target, page-1)) }
        slice.forEach((death, i) => {
            const vector = formatVector3(death[1], player)
            f.button(
                `§l${vector}\n` +
                `${formatTime(death[0], player)}`, getDimension(death[2], player)[1], () => {
                    new ActionFormHelper()
                    .title(`Death #${i+1}`)
                    .body(
                        `Cause: §l${formatDeathCause(death[3], player)}§r\n` +
                        `Position: ${vector}\n` +
                        `Dimension: §l${getDimension(death[2], player)[0]}§r\n` +
                        `Time happened: §l${formatTime(death[0], player)}§r\n` +
                        (death.length > 4 ? "\n===== Extra Information ====\n" : "") +
                        (death.length == 5 ? `${death[4][0]}: §l${death[4][1]}§r\n` : "") +
                        (death.length == 6 ? `${death[5][0]}: §l${death[5][1]}§r` : "")
                    )
                    .button("<Return>", "", () => deathlog(target, page))
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
        f.show(player)
    }
}