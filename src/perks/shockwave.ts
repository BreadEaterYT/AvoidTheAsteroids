import { object2d } from "@/object"
import { vec2 } from "@/gl_utils"
import { objects } from "@/index"
import { perk } from "@/perks/perk"

export class shockwave extends perk {
    private readonly shockwave_radius: number = 800

    constructor(position: vec2, size: vec2, sprite_url: string, apparition_time: number){
        super(position, size, sprite_url, apparition_time, 0.10, false)
    }

    public apply(_player: object2d): void {}
    public trigger(player: object2d): void {
        for (const obj of objects){
            if (!obj.id.endsWith("_asteroid")) continue

            const dx = obj.position[0] - player.position[0]
            const dy = obj.position[1] - player.position[1]
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance <= this.shockwave_radius){
                const speed = Math.sqrt(obj.velocity[0] * obj.velocity[0] + obj.velocity[1] * obj.velocity[1])

                obj.velocity[0] = (dx / distance) * speed
                obj.velocity[1] = (dy / distance) * speed
            }
        }
    }
}