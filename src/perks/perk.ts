import { object2d } from "@/object"
import { vec2 } from "@/gl_utils"

export abstract class perk extends object2d {
    public spawned: boolean = false
    public sprite: HTMLImageElement = new Image()
    public apparition_time: number = 0
    public applied: boolean = false
    public spawn_chance: number
    public passive: boolean

    private readonly initial_apparition_time: number = 0
    private spawn_timer: number = 0

    protected constructor(position: vec2, size: vec2, sprite_url: string, apparition_time: number, spawn_chance: number, passive: boolean){
        super(position, size, 0, [0, 0], "player_perk")
        this.sprite.src = sprite_url
        this.initial_apparition_time = apparition_time
        this.apparition_time = apparition_time
        this.spawn_chance = spawn_chance
        this.passive = passive
    }

    public abstract apply(player: object2d): void
    public abstract trigger(player: object2d): void

    public update(deltaTime: number): void {
        if (!this.spawned){
            this.spawn_timer += deltaTime
            return
        }

        if (!this.spawned) return
        if (this.apparition_time > 0){
            this.apparition_time -= deltaTime

            if (this.apparition_time <= 0) this.despawn()
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        if (!this.spawned) return

        ctx.save()
        ctx.translate(this.position[0], this.position[1])
        ctx.rotate(this.rotation)
        ctx.drawImage(this.sprite, -this.size[0] / 2, -this.size[1] / 2, this.size[0], this.size[1])
        ctx.restore()

        // circle that shows how much time it is left before the perk despawns (hollow circle, depletes from top to bottom)
        
        ctx.save()
        ctx.beginPath()

        ctx.arc(this.position[0], this.position[1], this.size[0] + 12, -Math.PI / 2, (-Math.PI / 2) + (Math.PI * 2 * (this.apparition_time / this.initial_apparition_time)), false)
        ctx.strokeStyle = "#3b73b4"
        ctx.lineWidth = 8
        ctx.lineCap = "round"
        ctx.stroke()

        ctx.restore()
    }

    public on_collision(other: object2d): void {
        if (!this.spawned) return
        if (other.id !== "player") return

        this.apply(other)
        this.despawn()
    }

    public spawn(position?: vec2){
        if (position !== undefined) this.position = position

        this.apparition_time = this.initial_apparition_time
        this.spawn_timer = 0
        this.spawned = true
        this.destroyed = false
        this.applied = false
    }

    public can_attempt_spawn(): boolean {
        if (this.spawned) return false
        if (this.spawn_timer < 1) return false

        this.spawn_timer -= 1
        return Math.random() < this.spawn_chance
    }

    public despawn(): void {
        if (!this.spawned) return

        this.spawned = false
        this.destroyed = false
        this.spawn_timer = 0
    }
}