import { Player, system, RawMessage } from "@minecraft/server"
import { ModalFormData, ModalFormResponse } from "@minecraft/server-ui"

const allowedParts: { [key: string]: any } = {
    divider: (form: ModalFormData) => { form.divider() },
    dropdown: (form: ModalFormData, label: any, items: any, opt?: any) => { form.dropdown(label, items, opt) },
    header: (form: ModalFormData, text: any) => { form.header(text) },
    label: (form: ModalFormData, text: any) => { form.label(text) },
    slider: (form: ModalFormData, label: any, minVal: any, maxVal: number, opt?: any) => { form.slider(label, minVal, maxVal, opt) },
    textField: (form: ModalFormData, label: any, placeholder: any, opt?: any) => { form.textField(label, placeholder, opt) },
    toggle: (form: ModalFormData, label: any, opt?: any) => { form.toggle(label, opt) }
}

/**
 * Easier part values handling and text formatting
 */
export default class ModalFormHelper {
    form: ModalFormData
    parts: { [key: string]: any[] }[]
    titleT: any
    submitBtn: any

    constructor() {
        this.form = new ModalFormData()
        this.parts = []
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
     * @remarks Adds a divider part into the form.
     * @returns
     */
    divider() {
        this.parts.push({"divider": []})
        return this
    }
    
    /**
     * @remarks Adds a dropdown with choices to the form.
     * @returns 
     */
    dropdown(text: RawMessage | string, choices: (RawMessage | string)[], defaultValueIndex?: number | null, tooltip?: (RawMessage | string) | null) {
        this.parts.push({"dropdown": [text, choices, { defaultValueIndex, tooltip }]})
        return this
    }

    /**
     * @remarks Adds a header part into the form.
     * @returns
     */
    header(text: RawMessage | string) {
        this.parts.push({"header": [text]})
        return this
    }

    /**
     * @remarks Adds a label part into the form.
     * @returns
     */
    label(text: RawMessage | string) {
        this.parts.push({"label": [text]})
        return this
    }

    /**
     * @remarks Adds a numeric slider to the form.
     * @returns 
     */
    slider(text: RawMessage | string, min: number, max: number, valueStep: number | null = 1, defaultValue?: number | null, tooltip?: (RawMessage | string) | null) {
        if (typeof valueStep !== "number" || valueStep <= 0) { valueStep = 1 }
        this.parts.push({"slider": [text, min, max, { valueStep, defaultValue, tooltip }]})
        return this
    }

    /**
     * @param {RawMessage | string} text 
     * @returns 
     */
    submitButton(text: RawMessage | string) {
        this.submitBtn = text
        return this
    }

    /**
     * @remarks Adds a textbox to the form.
     * @returns 
     */
    textField(text: RawMessage | string, placeholder: RawMessage | string = "", defaultValue?: string | null, tooltip?: (RawMessage | string) | null) {
        this.parts.push({"textField": [text, placeholder, { defaultValue, tooltip }]})
        return this
    }

    /**
     * @remarks Adds a toggle checkbox button to the form.
     * @returns 
     */
    toggle(text: RawMessage | string, defaultValue?: boolean | null, tooltip?: (RawMessage | string) | null) {
        this.parts.push({"toggle": [text, { defaultValue, tooltip }]})
        return this
    }
    
    /**
     * @remarks
     * Creates and shows this modal popup form. Returns asynchronously when the player confirms or cancels the dialog.
     */
    show(player: Player, force: boolean = false, callback: (cancelationReason?: string | null) => void = () => {}): Promise<ModalFormResponse> {
        // Create the form elements and parse its text
        this.form.title(this.titleT)
        this.submitBtn && this.form.submitButton(this.submitBtn)

        this.parts.forEach(part => {
            for (const type in part) {
                if (!Object.keys(allowedParts).includes(type)) continue;
                const [text, ...values] = part[type]
                allowedParts[type](text, ...values)
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