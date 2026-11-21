export default class MCRange {
    readonly min: number;
    readonly max: number;
    readonly step: number;
    readonly default: number;

    constructor(min: number, max: number, step: number, defaultVal?: number) {
        this.min = min
        this.max = max
        this.step = step
        this.default = defaultVal || min
    }
}