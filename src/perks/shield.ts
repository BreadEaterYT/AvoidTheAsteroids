import { object2d } from "@/object"
import { perk } from "./perk"
import { player } from "@/objects/player"

export class shield extends perk {
    constructor(position: [number, number], size: [number, number], sprite_url: string, apparition_time: number){
        super(position, size, sprite_url, apparition_time, 0.10, true)
    }

    public trigger(_player: object2d){}
    public apply(player: object2d): void {
        (player as player).invulnerable = true
    }
}