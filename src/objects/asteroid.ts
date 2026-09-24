import { object2d } from "@/object"
import { trigger_gameover, release_perk, applied_perks, gameWidth, gameHeight } from "@/index"
import { player } from "./player"
import { shield } from "@/perks/shield"
import * as glUtils from "../gl_utils"

export class asteroid extends object2d {
    private readonly asteroid_sprite: HTMLImageElement
    private has_entered_canvas: boolean = false

    constructor(position: glUtils.vec2, size: glUtils.vec2, rotation: number, velocity: glUtils.vec2 = [0, 0], id: string){
        super(position, size, rotation, velocity, id)

        this.asteroid_sprite = new Image()
        this.asteroid_sprite.src = "./img/asteroid.png"
    }

    public update(deltaTime: number): void {
        this.position[0] += this.velocity[0] * deltaTime
        this.position[1] += this.velocity[1] * deltaTime
        this.rotation += (Math.random() - 0.5) * 2 * deltaTime
        this.rotation = this.rotation % 360

        const is_inside = this.position[0] >= 0 && this.position[0] <= gameWidth && this.position[1] >= 0 && this.position[1] <= gameHeight
        if (is_inside) this.has_entered_canvas = true

        if (this.has_entered_canvas){
            if (this.position[0] < 0 || this.position[0] > gameWidth || this.position[1] < 0 || this.position[1] > gameHeight) this.destroyed = true
            return
        }

        const buffer = 200
        if (this.position[0] < -buffer || this.position[0] > gameWidth + buffer || this.position[1] < -buffer || this.position[1] > gameHeight + buffer) this.destroyed = true
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save()
        ctx.translate(this.position[0], this.position[1])
        ctx.rotate(this.rotation)

        ctx.drawImage(this.asteroid_sprite, -this.size[0] / 2, -this.size[1] / 2, this.size[0], this.size[1])
        ctx.restore()
    }

    public on_collision(other: object2d): void {
        if (other.id === "player"){
            const player = other as player

            if (player.invulnerable){
                this.destroyed = true

                for (const perk of applied_perks){
                    if (perk instanceof shield){
                        perk.applied = false
                        player.invulnerable = false

                        release_perk(perk)
                        break
                    }
                }

                return
            }

            player.is_dead = true
            trigger_gameover()
        }
    }
}