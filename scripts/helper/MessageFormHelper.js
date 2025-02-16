import { Player, system } from "@minecraft/server";
import { MessageFormData } from "@minecraft/server-ui";

export default class MessageFormHelper {
    constructor() {
        this.form = new MessageFormData()
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
     * @remarks This method sets the text for the first button on the dialog.
     * @param {RawMessage | string} text 
     * @param {function} callback 
     * @returns 
     */
    button1(text, callback) {
        /**
         * `[text, callback]`
         */
        this.button2A = [text]

        if (typeof callback != "function") return this;
        this.button2A[1] = callback
        
        return this
    }

    /**
     * @remarks This method sets the text for the second button on the dialog.
     * @param {RawMessage | string} text 
     * @param {function} callback 
     * @returns 
     */
    button2(text, callback) {
        /**
         * `[text, callback]`
         */
        this.button1A = [text]

        if (typeof callback != "function") return this;
        this.button1A[1] = callback
        
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
        this.form.button1(this.button1A[0])
        this.form.button2(this.button2A[0])

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
                
                const handler = tthis[`button${selection+1}A`]
                
                if (handler) {
                    try { handler[1](response) } 
                    catch (error) { console.error( error, error.stack ) }
                }
                
                resolve(response)
            })
        })
    }
}