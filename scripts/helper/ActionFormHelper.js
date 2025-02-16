import { Player, system } from "@minecraft/server"
import { ActionFormData } from "@minecraft/server-ui"

/**
 * Easier button callback handling
 */
export default class ActionFormHelper {
    constructor() {
        this.form = new ActionFormData()
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
        this.buttons.push([text, iconPath])

        if (typeof callback != "function") return this;
        this.buttons[this.buttons.length - 1].push(callback)
        
        return this
    }
    
    /**
     * @remarks
     * Creates and shows this modal popup form. Returns asynchronously when the player confirms or cancels the dialog.
     * 
     * @param {Player} player Player to show this dialog to
     * @param {boolean} force Forces the form to open if the user is still busy until the user no longer busy
     * @param {function} callback Function to run if the form were closed (UserClosed)
     * @returns 
     */
    show(player, force = false, callback = () => {}) {
        // Create the form elements
        this.form.title(this.titleT)
        this.form.body(this.bodyT)
        this.buttons.forEach(el => this.form.button(el[0], el[1]))

        const tthis = this
        
        return new Promise(resolve => {
            system.run(async function runnable() {
                const response = await tthis.form.show( player )
                const {selection, canceled, cancelationReason} = response
                
                if (canceled) {
                    if (force && cancelationReason == "UserBusy") { system.run(runnable); return }
                    callback(cancelationReason)
                    return
                }
                
                const handler = tthis.buttons[selection]
                
                if (handler && handler[2]) {
                    try { handler[2](response) } 
                    catch (error) { console.error( error, error.stack ) }
                }
                
                resolve(response)
            })
        })
    }
}