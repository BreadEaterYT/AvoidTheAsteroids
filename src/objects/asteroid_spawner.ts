import { object2d } from "@/object"
import { objects } from "@/index"
import { asteroid } from "./asteroid"
import * as glUtils from "../gl_utils"

export class asteroid_spawner extends object2d {
    private static readonly DEBUG = false // displays where the spawner is and the approximative direction asteroids will travel

    private spawn_timer = 0
    public spawn_rate = 0.5
    private spawn_delay = this.random_spawn_delay()

    public asteroid_speed = 3
    public enabled: boolean = true
    public side: string

    public static spawn(count: number, side: "top" | "bottom" | "left" | "right", width: number, height: number): void {
        const spacing = (side === "left" || side === "right" ? height : width) / (count + 1)

        const spawner_width = 16
        const spawner_height = 8

        for (let i = 0; i < count; i++){
            let x: number
            let y: number

            switch (side){
                case "left":
                    x = (0 - spawner_width)
                    y = spacing * i
                    break

                case "right":
                    x = width
                    y = spacing * i
                    break

                case "top":
                    x = spacing * i
                    y = (0 - spawner_height)
                    break

                case "bottom":
                    x = spacing * i
                    y = height
                    break
            }

            objects.push(new asteroid_spawner([x, y], [16, 8], 0, [0, 0], `asteroid_spawner_${side}_${i}`, side))
        }
    }

    constructor(position: glUtils.vec2, size: glUtils.vec2, rotation: number, velocity: glUtils.vec2 = [0, 0], id: string, side: string = "left"){
        super(position, size, rotation, velocity, id)

        this.side = side
    }

    private random_spawn_delay(): number {
        const extra_delay = 1

        return extra_delay + this.spawn_rate - 1 + Math.random() * 2
    }

    public update(deltaTime: number): void {
        if (!this.enabled) return

        this.spawn_timer += deltaTime

        if (this.spawn_timer >= this.spawn_delay){
            this.spawn_timer -= this.spawn_delay
            this.spawn_delay = this.random_spawn_delay()

            let baseAngle: number

            switch (this.side) {
                case "left":
                    baseAngle = 0
                    break

                case "right":
                    baseAngle = Math.PI
                    break

                case "top":
                    baseAngle = Math.PI / 2
                    break

                case "bottom":
                    baseAngle = -Math.PI / 2
                    break

                default:
                    baseAngle = 0
            }

            const angle = baseAngle + (Math.random() * 90 - 5) * Math.PI / 180
            const velocityX = Math.cos(angle) * this.asteroid_speed * 100
            const velocityY = Math.sin(angle) * this.asteroid_speed * 100

            objects.push(new asteroid([...this.position], [32, 32], 0, [velocityX, velocityY], `${this.side}_asteroid`))
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save()
        ctx.translate(this.position[0], this.position[1])
        ctx.rotate(this.rotation)

        ctx.fillStyle = asteroid_spawner.DEBUG ? "red" : "transparent"
        ctx.fillRect(-this.size[0] / 2, -this.size[1] / 2, this.size[0], this.size[1])

        if (asteroid_spawner.DEBUG){
            ctx.save()

            switch (this.side){
                case "left":
                    ctx.rotate(Math.PI / 2)
                    break

                case "right":
                    ctx.rotate(-Math.PI / 2)
                    break

                case "top":
                    ctx.rotate(Math.PI)
                    break

                case "bottom":
                    ctx.rotate(0)
                    break
            }

            const arrowLength = this.size[1]
            const arrowWidth = this.size[0] / 2

            ctx.fillStyle = "yellow"
            ctx.beginPath()

            ctx.moveTo(0, -this.size[1] / 2 - arrowLength)
            ctx.lineTo(-arrowWidth, -this.size[1] / 2 - arrowLength / 2)
            ctx.lineTo(arrowWidth, -this.size[1] / 2 - arrowLength / 2)
            ctx.closePath()
            ctx.fill()

            ctx.restore()
        }

        ctx.restore()
    }

    public on_collision(_other: object2d): void {}
}