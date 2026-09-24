import { object2d } from "@/object"
import * as glUtils from "../gl_utils"

export class player extends object2d {
    public acceleration = 3000
    public maxSpeed = 1200
    public friction = 0.08
    public sprite_flipped: boolean = false
    public is_dead: boolean = false
    public invulnerable: boolean = false

    private readonly player_sprite: HTMLImageElement
    private readonly player_dead_sprite: HTMLImageElement

    constructor(position: glUtils.vec2, size: glUtils.vec2, rotation: number, velocity: glUtils.vec2 = [0, 0], id: string){
        super(position, size, rotation, velocity, id)

        this.player_sprite = new Image()
        this.player_sprite.src = "./img/player.png"
        this.player_dead_sprite = new Image()
        this.player_dead_sprite.src = "./img/player_dead.png"
    }

    public update(deltaTime: number): void {
        const friction = Math.pow(1 - this.friction, deltaTime * 60)

        this.position[0] += this.velocity[0] * deltaTime
        this.position[1] += this.velocity[1] * deltaTime

        this.velocity[0] *= friction
        this.velocity[1] *= friction

        const speed = Math.sqrt(this.velocity[0] * this.velocity[0] + this.velocity[1] * this.velocity[1])

        if (speed > this.maxSpeed){
            const scale = this.maxSpeed / speed

            this.velocity[0] *= scale
            this.velocity[1] *= scale
        }

        if (Math.abs(this.velocity[0]) < 0.01) this.velocity[0] = 0
        if (Math.abs(this.velocity[1]) < 0.01) this.velocity[1] = 0
    }

    public on_collision(_other: object2d): void {}

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save()
        ctx.translate(this.position[0], this.position[1])
        ctx.rotate(this.rotation)

        if (this.sprite_flipped) ctx.scale(-1, 1)

        ctx.drawImage(this.is_dead ? this.player_dead_sprite : this.player_sprite, -this.size[0] / 2, -this.size[1] / 2, this.size[0], this.size[1])
        ctx.restore()
    }
}