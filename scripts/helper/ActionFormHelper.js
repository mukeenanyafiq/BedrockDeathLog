import { Player, system } from "@minecraft/server"
import { ActionFormData, ActionFormResponse } from "@minecraft/server-ui"

const dtimeout = 20 * 5

/**
 * Easier button callback handling and text formatting
 */
export default class ActionFormHelper {
    constructor() {
        this.form = new ActionFormData()
        /** @type {[string, string?, () => void?]} */
        this.buttons = []
    }
    
    /**
     * @remarks This builder method sets the title for the modal dialog.
     * @param {RawMessage | string} titleText 
     * @returns 
     */
    title(titleText) {
        this.titleT = titleText
        return this
    }

    /**
     * @remarks Method that sets the body text for the modal form.
     * @param {RawMessage | string} bodyText 
     * @returns 
     */
    body(bodyText) {
        this.bodyT = bodyText
        return this
    }
    
    /**
     * @remarks Adds a button to this form with an icon from a resource pack.
     * @param {RawMessage | string} text 
     * @param {string?} iconPath 
     * @param {function?} callback 
     * @returns 
     */
    button(text, iconPath, callback) {
        let button = [text, iconPath]
        
        if (typeof callback === "function") { button.push(callback) }
        this.buttons.push(button)

        return this
    }
    
    /**
     * @remarks
     * Creates and shows this modal popup form. Returns asynchronously when the player confirms or cancels the dialog.
     * 
     * @param {Player} player Player to show this dialog to
     * @param {boolean} force Forces the form to open if the user is still busy until the user no longer busy
     * @param {function} callback Function to run if the form were closed (UserClosed)
     * @returns {Promise<ActionFormResponse>}
     */
    show(player, force = false, callback = () => {}) {
        // Create the form elements and parse its text
        this.form.title(this.titleT)
        this.form.body(this.bodyT)
        this.buttons.forEach(el => this.form.button(el[0], el[1]))
        
        const tthis = this

        return new Promise(resolve => {
            system.run(async function runnable() {
                const res = await tthis.form.show( player )
                
                if (res.canceled) {
                    if (force && res.cancelationReason == "UserBusy") { return system.run(runnable) }
                    return callback(res.cancelationReason)
                }
                
                const handler = tthis.buttons[res.selection]
                
                if (handler && handler[2]) {
                    try { handler[2](res) } 
                    catch (error) { console.error( error, error.stack ) }
                }
                
                resolve(res)
            })
        })
    }
}