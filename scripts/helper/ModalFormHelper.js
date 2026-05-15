import { Player, system, RawMessage } from "@minecraft/server"
import { ModalFormData, ModalFormResponse } from "@minecraft/server-ui"

/**
 * Easier part values handling and text formatting
 */
export default class ModalFormHelper {
    constructor() {
        this.form = new ModalFormData()
        this.parts = []
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
     * @remarks Adds a divider part into the form.
     * @returns
     */
    divider() {
        this.parts.push({"divider": []})
        return this
    }
    
    /**
     * @remarks Adds a dropdown with choices to the form.
     * @param {RawMessage | string} text 
     * @param {(RawMessage | string)[]} choices 
     * @param {number?} defaultValueIndex
     * @param {(RawMessage | string)?} tooltip
     * @returns 
     */
    dropdown(text, choices, defaultValueIndex, tooltip) {
        this.parts.push({"dropdown": [text, choices, { defaultValueIndex, tooltip }]})
        return this
    }

    /**
     * @remarks Adds a header part into the form.
     * @param {RawMessage | string} text 
     * @returns
     */
    header(text) {
        this.parts.push({"header": [text]})
        return this
    }

    /**
     * @remarks Adds a label part into the form.
     * @param {RawMessage | string} text 
     * @returns
     */
    label(text) {
        this.parts.push({"label": [text]})
        return this
    }

    /**
     * @remarks Adds a numeric slider to the form.
     * @param {RawMessage | string} text 
     * @param {number} min 
     * @param {number} max 
     * @param {number?} valueStep
     * @param {number?} defaultValue
     * @param {(RawMessage | string)?} tooltip
     * @returns 
     */
    slider(text, min, max, valueStep = 1, defaultValue, tooltip) {
        if (typeof valueStep !== "number" || valueStep <= 0) { valueStep = 1 }
        this.parts.push({"slider": [text, min, max, { valueStep, defaultValue, tooltip }]})
        return this
    }

    /**
     * @param {RawMessage | string} text 
     * @returns 
     */
    submitButton(text) {
        this.submitBtn = text
        return this
    }

    /**
     * @remarks Adds a textbox to the form.
     * @param {RawMessage | string} text 
     * @param {RawMessage | string} placeholder 
     * @param {string?} defaultValue
     * @param {(RawMessage | string)?} tooltip
     * @returns 
     */
    textField(text, placeholder = "", defaultValue, tooltip) {
        this.parts.push({"textField": [text, placeholder, { defaultValue, tooltip }]})
        return this
    }

    /**
     * @remarks Adds a toggle checkbox button to the form.
     * @param {RawMessage | string} text 
     * @param {boolean?} defaultValue
     * @param {(RawMessage | string)?} tooltip
     * @returns 
     */
    toggle(text, defaultValue, tooltip) {
        this.parts.push({"toggle": [text, { defaultValue, tooltip }]})
        return this
    }
    
    /**
     * @remarks
     * Creates and shows this modal popup form. Returns asynchronously when the player confirms or cancels the dialog.
     * 
     * @param {Player} player Player to show this dialog to
     * @param {boolean} force Forces the form to open if the user is still busy until the user no longer busy
     * @param {function} callback Function to run if the form were closed (UserClosed)
     * @returns {Promise<ModalFormResponse>}
     */
    show(player, force = false, callback = (cancelationReason) => {}) {
        // Create the form elements and parse its text
        this.form.title(this.titleT)
        this.submitBtn && this.form.submitButton(this.submitBtn)

        this.parts.forEach(part => {
            for (const type in part) {
                const [text, ...values] = part[type]
                this.form[type](text, ...values)
            }
        })

        const tthis = this
        
        return new Promise(resolve => {
            system.run(async function runnable() {
                let res = await tthis.form.show(player)
                
                if (res.canceled) {
                    if (force && res.cancelationReason == "UserBusy") { return system.run(runnable) }
                    return callback(res.cancelationReason)
                }

                resolve(res)
            })
        })
    }
}