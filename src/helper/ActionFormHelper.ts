import { Player, RawMessage, system } from "@minecraft/server"
import { ActionFormData, ActionFormResponse, FormCancelationReason } from "@minecraft/server-ui"

const dtimeout = 20 * 5

type ActionFormButton = [RawMessage | string, string?, ((...args: any[]) => void)?]

/**
 * Easier button callback handling and text formatting
 */
export default class ActionFormHelper {
    form: ActionFormData;
    buttons: ActionFormButton[];
    titleT: any;
    bodyT: any;

    constructor() {
        this.form = new ActionFormData()
        this.buttons = []
    }
    
    /**
     * @remarks This builder method sets the title for the modal dialog.
     * @returns 
     */
    title(titleText: RawMessage | string) {
        this.titleT = titleText
        return this
    }

    /**
     * @remarks Method that sets the body text for the modal form.
     * @returns 
     */
    body(bodyText: RawMessage | string) {
        this.bodyT = bodyText
        return this
    }
    
    /**
     * @remarks Adds a button to this form with an icon from a resource pack.
     * @returns 
     */
    button(text: RawMessage | string, iconPath?: string, callback?: (...args: any[]) => void) {
        let button: ActionFormButton = [text, iconPath]
        
        if (typeof callback === "function") { button.push(callback) }
        this.buttons.push(button)

        return this
    }
    
    /**
     * @remarks
     * Creates and shows this modal popup form. Returns asynchronously when the player confirms or cancels the dialog.
     */
    show(player: Player, force: boolean = false, callback: (cancelationReason?: FormCancelationReason) => void = () => {}): Promise<ActionFormResponse> {
        // Create the form elements and parse its text
        this.form.title(this.titleT)
        this.form.body(this.bodyT)
        this.buttons.forEach(el => this.form.button(el[0], el[1]))
        
        const dthis = this

        return new Promise(resolve => {
            system.run(async function runnable() {
                const res = await dthis.form.show( player )
                
                if (res.canceled) {
                    if (force && res.cancelationReason == "UserBusy") { return system.run(runnable) }
                    return callback(res.cancelationReason)
                }
                
                const handler = dthis.buttons[res.selection || -1]
                
                if (handler && handler[2]) {
                    try { handler[2](res) } 
                    catch (error) { console.error( error ) }
                }
                
                resolve(res)
            })
        })
    }
}