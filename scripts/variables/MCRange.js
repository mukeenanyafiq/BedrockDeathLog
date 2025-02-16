export default class MCRange {
    /**
     * @param {number} min 
     * @param {number} max 
     * @param {number} step 
     * @param {number} defaultVal 
     */
    constructor(min, max, step, defaultVal) {
        this.min = min
        this.max = max
        this.step = step
        this.default = defaultVal || min
    }
}