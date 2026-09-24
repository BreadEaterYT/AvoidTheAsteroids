import * as glUtils from "./gl_utils"

export abstract class object2d {
    public position: glUtils.vec2 
    public size: glUtils.vec2 
    public rotation: number 
    public velocity: glUtils.vec2 = [0, 0] 
    public id: string
    public destroyed: boolean = false
    
    protected constructor(position: glUtils.vec2, size: glUtils.vec2, rotation: number, velocity: glUtils.vec2 = [0, 0], id: string) {
        this.position = position 
        this.size = size 
        this.rotation = rotation 
        this.velocity = velocity 
        this.id = id 

        this.position[0] += this.size[0] / 2 
        this.position[1] += this.size[1] / 2 
    }

    public abstract update(deltaTime: number): void
    public abstract draw(ctx: CanvasRenderingContext2D): void
    public abstract on_collision(other: object2d): void
}