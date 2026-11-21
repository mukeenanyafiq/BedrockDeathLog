export interface DeathLogConfig {
    "logDeath"?: boolean | undefined,
    "roundDeathPos"?: boolean | undefined,
    "fixedDecimal"?: number | undefined,
    "ascending"?: boolean | undefined,
    "showMilliseconds"?: boolean | undefined,
    "msFixed"?: number | undefined,
    "useNumberTime"?: boolean | undefined,
    "useDimensionId"?: boolean | undefined,
    "useShortenedCause"?: boolean | undefined,
    "listPerPage"?: number | undefined
}

export interface HandsDownJustWhatsTakenFromPlayerObject {
    name: string;
    id: string;
}

export type Deathlog = [number, { x: number, y: number, z: number }, string, string, ["Entity" | "Projectile", string]?, ["Projectile", string]?]