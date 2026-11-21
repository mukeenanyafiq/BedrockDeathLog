import { Player, RawMessage, system } from "@minecraft/server";
import { FormCancelationReason, MessageFormData, MessageFormResponse } from "@minecraft/server-ui";

type MessageFormButton = [RawMessage | string, (() => void)?]
export default class MessageFormHelper {
    readonly form: MessageFormData;
    titleT: any;
    bodyT: any;
    button1A: MessageFormButton | any;
    button2A: MessageFormButton | any;

    constructor() {
        this.form = new MessageFormData()
    }
    
    /**
     * @remarks This builder method sets the title for the modal dialog.
     * @param {RawMessage | string} titleText 
     * @returns 
     */
    title(titleText: RawMessage | string) {
        this.titleT = titleText
        return this
    }
    
    /**
     * @remarks Method that sets the body text for the modal form.
     * @param {RawMessage | string} bodyText 
     * @returns 
     */
    body(bodyText: RawMessage | string) {
        this.bodyT = bodyText
        return this
    }
    
    /**
     * @remarks This method sets the text for the first button on the dialog.
     * @param {RawMessage | string} text 
     * @param {function} callback 
     * @returns 
     */
    button1(text: RawMessage | string, callback: () => void) {        
        let button: MessageFormButton = [text]
        if (typeof callback === "function") { button[1] = callback }
        
        this.button1A = button
        return this
    }

    /**
     * @remarks This method sets the text for the second button on the dialog.
     * @returns 
     */
    button2(text: RawMessage | string, callback: () => void) {
        let button: MessageFormButton = [text]
        if (typeof callback === "function") { button[1] = callback }
        
        this.button2A = button
        return this
    }
    
    /**
     * @remarks
     * Creates and shows this modal popup form. Returns asynchronously when the player confirms or cancels the dialog.
     */
    show(player: Player, force: boolean | null = false, callback: (cancelationReason?: FormCancelationReason) => void = () => {}): Promise<MessageFormResponse> {
        // Create the form elements and parse its text
        this.form.title(this.titleT)
        this.form.body(this.bodyT)
        this.form.button1(this.button1A[0])
        this.form.button2(this.button2A[0])

        const dthis = this
        
        return new Promise(resolve => {
            system.run(async function runnable() {
                const res = await dthis.form.show( player )
                
                if (res.canceled) {
                    if (force && res.cancelationReason == "UserBusy") { return system.run(runnable) }
                    return callback(res.cancelationReason)   
                }
                
                const selection = res.selection === 0 ? 1 : 2
                const handler = dthis[`button${selection}A`]
                
                if (handler) {
                    try { handler[1](res) }
                    catch (error) { console.error( error ) }
                }
                
                resolve(res)
            })
        })
    }
}