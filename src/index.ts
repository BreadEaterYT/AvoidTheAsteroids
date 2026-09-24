import {object2d} from "./object"
import {player} from "./objects/player"
import {asteroid_spawner} from "./objects/asteroid_spawner"
import {perk} from "./perks/perk"
import {shield} from "./perks/shield"
import {shockwave} from "./perks/shockwave"
import * as glUtils from "./gl_utils"

const version = "v0.1.0 (perk update)"

type touch_screen_t = {
    active: boolean,
    start: glUtils.vec2,
    coordinates: glUtils.vec2,
    orientation: number
}

export type player_data = {
    id?: string
    username?: string
    score?: number
}

export const objects: object2d[] = []
export const reset_game = () => {
    cleanup_game()
    main()
}

export let canvas_ctx: CanvasRenderingContext2D | undefined
export const active_perk_cooldown = 1000 // in ms
export const gameWidth = 1920
export const gameHeight = 1080
export let active_perk_current_cooldown = active_perk_cooldown

export const applied_perks: perk[] = []
export const available_perks: perk[] = [
    new shield([0, 0], [30, 30], "/img/perks/shield.png", 5),
    new shockwave([0, 0], [30, 30], "/img/perks/shockwave.png", 5)
]

function random_perk_position(): glUtils.vec2 {
    return [Math.random() * gameWidth, Math.random() * gameHeight]
}

function object_overlaps(a: object2d, b: object2d): boolean {
    const dx = a.position[0] - b.position[0]
    const dy = a.position[1] - b.position[1]

    const distance = Math.sqrt(dx * dx + dy * dy)
    const radiusA = Math.max(a.size[0], a.size[1]) / 2
    const radiusB = Math.max(b.size[0], b.size[1]) / 2

    return distance < radiusA + radiusB
}

function render_perks_list(): void {
    const perks_list = document.getElementById("perks_list") as HTMLDivElement | null
    if (perks_list === null) return

    perks_list.style.display = applied_perks.length > 0 ? "flex" : "none"

    perks_list.replaceChildren(
        ...applied_perks.map((active_perk) => {
            const perk_icon = document.createElement("img")

            perk_icon.className = "perk_icon"
            perk_icon.src = active_perk.sprite.src
            perk_icon.alt = active_perk.id

            return perk_icon
        }),
    )
}

export function collect_perk(active_perk: perk, target_player: player): void {
    const availableIndex = available_perks.indexOf(active_perk)

    if (availableIndex !== -1) available_perks.splice(availableIndex, 1)
    if (!applied_perks.includes(active_perk)) applied_perks.push(active_perk)

    active_perk.applied = true
    active_perk.spawned = false
    active_perk.destroyed = false

    active_perk.apply(target_player)
    render_perks_list()
}

export function release_perk(active_perk: perk): void {
    const appliedIndex = applied_perks.indexOf(active_perk)

    if (appliedIndex !== -1) applied_perks.splice(appliedIndex, 1)
    if (!available_perks.includes(active_perk)) available_perks.push(active_perk)

    active_perk.applied = false
    active_perk.destroyed = false
    active_perk.despawn()
    render_perks_list()
}

function reset_perks(): void {
    while (applied_perks.length > 0){
        const active_perk = applied_perks.pop()!

        active_perk.applied = false
        active_perk.destroyed = false

        if (!available_perks.includes(active_perk)) available_perks.push(active_perk)
    }

    for (const active_perk of available_perks){
        active_perk.applied = false
        active_perk.destroyed = false
        active_perk.despawn()
    }

    render_perks_list()
}

let score = 0
let paused = false
let running = true
let score_timer = 0
let previous_time = 0
let resize_listener_registered = false
let fps_shown = localStorage.getItem("fps_shown") ? localStorage.getItem("fps_shown") === "true" : false
let fps_timer = 0
let fps = 60.0
let current_player_data: player_data = {
    score: parseInt(localStorage.getItem("best_score") || "0")
}

let touch_screen_controls: touch_screen_t = {
    active: false,
    start: [0, 0],
    coordinates: [0, 0],
    orientation: 0
}

let keys = new Set<string>()
let current_player: player | null = null
let animation_frame_id: number | null = null
let service_worker_installed = false

let keydown_listener: ((event: KeyboardEvent) => void) | null = null
let keyup_listener: ((event: KeyboardEvent) => void) | null = null
let touch_start_listener: ((event: TouchEvent) => void) | null = null
const resize_listener: (() => void) = () => {
    const canvas = document.getElementById("game") as HTMLDivElement
    const background = document.getElementById("background") as HTMLDivElement
    const pause_menu = document.getElementById("pause_menu") as HTMLDivElement
    const gameover_menu = document.getElementById("gameover_menu") as HTMLDivElement
    const start_menu = document.getElementById("start_menu") as HTMLDivElement
    const perks_list = document.getElementById("perks_list") as HTMLDivElement

    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    
    const scale = Math.min(windowWidth / gameWidth, windowHeight / gameHeight)
    
    const displayWidth = gameWidth * scale
    const displayHeight = gameHeight * scale
    const offsetX = (windowWidth - displayWidth) / 2
    const offsetY = (windowHeight - displayHeight) / 2

    apply_resize(canvas, displayWidth, displayHeight, offsetX, offsetY)
    apply_resize(background, displayWidth, displayHeight, offsetX, offsetY)

    const menuWidth = gameWidth
    const menuHeight = gameHeight

    apply_resize(pause_menu, menuWidth, menuHeight, offsetX, offsetY)
    apply_resize(gameover_menu, menuWidth, menuHeight, offsetX, offsetY)
    apply_resize(start_menu, menuWidth, menuHeight, offsetX, offsetY)

    pause_menu.style.transform = `scale(${scale})`
    gameover_menu.style.transform = `scale(${scale})`
    start_menu.style.transform = `scale(${scale})`
    perks_list.style.right = `${canvas.getBoundingClientRect().left + 16}px`
    perks_list.style.top = `${canvas.getBoundingClientRect().top + 16}px`
}

export function trigger_gameover(){
    running = false
    
    const gameover_menu = document.getElementById("gameover_menu") as HTMLDivElement
    const final_score = document.getElementById("final_score") as HTMLDivElement
    const restart_button = document.getElementById("restart_button") as HTMLButtonElement
    
    restart_button.onclick = () => {
        gameover_menu.style.display = "none"
        reset_game()
    }
    
    final_score.textContent = `Score: ${score} - Best: ${current_player_data.score ?? 0}`
    gameover_menu.style.display = "flex"
    
    if (localStorage.getItem("best_score") === null || score > parseInt(localStorage.getItem("best_score")!)) localStorage.setItem("best_score", score.toString())
}

function apply_resize(element: HTMLElement, width: number, height: number, left = 0, top = 0){
    element.style.width = `${width}px`
    element.style.height = `${height}px`
    element.style.minWidth = `${width}px`
    element.style.minHeight = `${height}px`
    element.style.maxWidth = `${width}px`
    element.style.maxHeight = `${height}px`
    element.style.position = "fixed"
    element.style.left = `${left}px`
    element.style.top = `${top}px`
}

function get_touch_game_position(clientX: number, clientY: number): glUtils.vec2 {
    const canvas = document.getElementById("game") as HTMLCanvasElement
    const rect = canvas.getBoundingClientRect()
    const normalized = glUtils.vec2_normalize([clientX - rect.left, clientY - rect.top], [rect.width, rect.height])

    return glUtils.vec2_scale(normalized, [gameWidth, gameHeight])
}

function update_touch_orientation(x: number, y: number){
    touch_screen_controls.coordinates[0] = x
    touch_screen_controls.coordinates[1] = y

    const deltaX = x - touch_screen_controls.start[0]
    const deltaY = y - touch_screen_controls.start[1]
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    if (distance < 8){
        touch_screen_controls.orientation = 0
        return
    }

    const angle = Math.atan2(deltaY, deltaX)
    
    touch_screen_controls.orientation = (angle * 180 / Math.PI + 360) % 360
}

function cleanup_game(){
    running = false
    
    if (animation_frame_id !== null){
        cancelAnimationFrame(animation_frame_id)
        animation_frame_id = null
    }
    
    if (keydown_listener !== null){
        window.removeEventListener("keydown", keydown_listener)
        keydown_listener = null
    }
    
    if (keyup_listener !== null){
        window.removeEventListener("keyup", keyup_listener)
        keyup_listener = null
    }

    if (touch_start_listener !== null){
        window.removeEventListener("touchstart", touch_start_listener)
        touch_start_listener = null
    }
    
    objects.length = 0
    
    keys.clear()
    current_player = null
}

function main(){
    const resume_button = document.getElementById("resume_button") as HTMLButtonElement
    const background = document.getElementById("background") as HTMLDivElement
    const pause_menu = document.getElementById("pause_menu") as HTMLDivElement
    const canvas = document.getElementById("game") as HTMLCanvasElement
    
    canvas_ctx = canvas.getContext("2d") as CanvasRenderingContext2D
    
    score = 0
    paused = false
    running = true
    score_timer = 0
    previous_time = performance.now()
    keys = new Set<string>()
    
    canvas.width = gameWidth
    canvas.height = gameHeight

    reset_perks()
    
    background.addEventListener("contextmenu", (event) => {
        event.preventDefault()
        return false
    })

    if (!resize_listener_registered){
        window.addEventListener("resize", resize_listener)
        document.addEventListener("fullscreenchange", resize_listener)
    }

    resize_listener()

    current_player = new player([(canvas.width / 2) - 25, (canvas.height / 2) - 25], [50, 50], 0, [0, 0], "player")
    objects.push(current_player)

    asteroid_spawner.spawn(4, "top", gameWidth, gameHeight)
    asteroid_spawner.spawn(4, "bottom", gameWidth, gameHeight)
    asteroid_spawner.spawn(6, "left", gameWidth, gameHeight)
    asteroid_spawner.spawn(6, "right", gameWidth, gameHeight)

    keyup_listener = (event: KeyboardEvent) => keys.delete(event.code)
    keydown_listener = (event: KeyboardEvent) => {
        if (event.key !== "Escape"){
            keys.add(event.code)
            return
        }

        paused = !paused
    }

    touch_start_listener = (event: TouchEvent) => {
        touch_screen_controls.active = true

        const [touchX, touchY] = get_touch_game_position(event.touches[0].clientX, event.touches[0].clientY)

        touch_screen_controls.start[0] = touchX
        touch_screen_controls.start[1] = touchY
        touch_screen_controls.coordinates[0] = touchX
        touch_screen_controls.coordinates[1] = touchY

        update_touch_orientation(touchX, touchY)
    }

    window.addEventListener("keyup", keyup_listener)
    window.addEventListener("keydown", keydown_listener)
    window.addEventListener("touchstart", touch_start_listener, { passive: false })

    window.addEventListener("touchmove", (event) => {
        if (!touch_screen_controls.active) return

        const [touchX, touchY] = get_touch_game_position(event.touches[0].clientX, event.touches[0].clientY)

        touch_screen_controls.coordinates[0] = touchX
        touch_screen_controls.coordinates[1] = touchY

        update_touch_orientation(touchX, touchY)
    }, { passive: false })

    window.addEventListener("touchend", () => {
        touch_screen_controls.active = false
        touch_screen_controls.orientation = 0
    })

    resume_button.onclick = () => paused = false

    const update = (deltaTime: number) => {
        if (current_player === null) return

        let inputX = 0
        let inputY = 0

        if (keys.has("KeyA")){
            current_player.sprite_flipped = true
            inputX -= 1
        }

        if (keys.has("KeyD")){
            current_player.sprite_flipped = false
            inputX += 1
        }

        if (keys.has("KeyW")) inputY -= 1
        if (keys.has("KeyS")) inputY += 1

        if (touch_screen_controls.active){
            inputX = touch_screen_controls.coordinates[0] - current_player.position[0]
            inputY = touch_screen_controls.coordinates[1] - current_player.position[1]

            const touchLength = Math.sqrt(inputX * inputX + inputY * inputY)
            const deadzone = 10
            const slowdownRadius = 100

            if (touchLength > deadzone){
                inputX /= touchLength
                inputY /= touchLength

                current_player.sprite_flipped = inputX < 0

                const control = 1 - current_player.friction
                let accelerationScale = 1

                if (touchLength < slowdownRadius) accelerationScale = touchLength / slowdownRadius

                current_player.velocity[0] += inputX * current_player.acceleration * control * accelerationScale * deltaTime
                current_player.velocity[1] += inputY * current_player.acceleration * control * accelerationScale * deltaTime
            }
        }

        const inputLength = Math.sqrt(inputX * inputX + inputY * inputY)

        if (inputLength > 0){
            inputX /= inputLength
            inputY /= inputLength

            const control = 1 - current_player.friction

            current_player.velocity[0] += inputX * current_player.acceleration * control * deltaTime
            current_player.velocity[1] += inputY * current_player.acceleration * control * deltaTime
        }

        for (let i = 0; i < objects.length; i++){
            const objA = objects[i]

            objA.update(deltaTime)

            if (objA !== current_player && (objA.position[0] < -80 || objA.position[0] > 2080 || objA.position[1] < -50 || objA.position[1] > 1180)){
                objA.destroyed = true
                continue
            }

            for (let j = i + 1; j < objects.length; j++){
                const objB = objects[j]

                if (object_overlaps(objA, objB)){
                    objA.on_collision(objB)
                    objB.on_collision(objA)
                }
            }
        }

        for (let i = available_perks.length - 1; i >= 0; i--){
            const active_perk = available_perks[i]

            active_perk.update(deltaTime)

            if (!active_perk.spawned && active_perk.can_attempt_spawn()) active_perk.spawn(random_perk_position())

            if (!active_perk.spawned || current_player === null) continue
            if (object_overlaps(active_perk, current_player)) collect_perk(active_perk, current_player)
        }

        render_perks_list()

        if (keys.has("KeyF")){
            let perk

            for (let i = applied_perks.length - 1; i >= 0; i--){
                perk = applied_perks[i]

                if (perk.passive) continue
                break
            }

            if (perk && active_perk_current_cooldown <= 0){
                perk.trigger(current_player)

                active_perk_current_cooldown = active_perk_cooldown
                release_perk(perk)
            }
        }

        for (let i = objects.length - 1; i >= 0; i--){
            if (objects[i].destroyed) objects.splice(i, 1)
        }

        active_perk_current_cooldown -= deltaTime * 1000
    }
    
    const draw = (canvas_ctx: CanvasRenderingContext2D) => {
        if (current_player === null) return
        for (const obj of objects) obj.draw(canvas_ctx)
        for (const active_perk of available_perks) active_perk.draw(canvas_ctx)
            
        const radius = current_player.size[0] / 2
        
        if (current_player.position[0] - radius < 0) current_player.position[0] = radius
        if (current_player.position[0] + radius > gameWidth) current_player.position[0] = gameWidth - radius
        if (current_player.position[1] - radius < 0) current_player.position[1] = radius
        if (current_player.position[1] + radius > gameHeight) current_player.position[1] = gameHeight - radius
        
        canvas_ctx.fillStyle = "white"
        canvas_ctx.font = "16px 'Press Start 2P'"
        canvas_ctx.fillText(`Score: ${score}`, 16, 32)
        canvas_ctx.fillText(`Best Score: ${current_player_data.score ?? 0}`, 16, 64)

        if (fps_shown) canvas_ctx.fillText(`FPS: ${fps.toFixed(2)}`, 16, touch_screen_controls.active ? 128 : 96)

        canvas_ctx.fillText(version, 16, 1080 - 16)
    }
    
    const loop = (currentTime: number) => {
        if (canvas_ctx == undefined) return

        pause_menu.style.display = paused && running ? "flex" : "none"
        
        if (!running || paused){
            animation_frame_id = requestAnimationFrame(loop)
            return
        }
        
        const deltaTime = Math.min((currentTime - previous_time) / 1000, 0.05)
        
        score_timer += deltaTime
        fps_timer += deltaTime
        previous_time = currentTime

        if (fps_timer >= 0.5){
            fps = 1 / deltaTime
            fps_timer -= 1
        }
        
        if (score_timer >= 1){
            score += 1
            score_timer -= 1
            
            if (score >= (current_player_data.score ?? 0)) current_player_data.score = score
        }
        
        canvas_ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        update(deltaTime)
        draw(canvas_ctx)
        
        animation_frame_id = requestAnimationFrame(loop)
    }
    
    animation_frame_id = requestAnimationFrame(loop)
}

if (!service_worker_installed && "serviceWorker" in navigator){
    navigator.serviceWorker.register("./sw.js")
    service_worker_installed = true
}

window.onload = () => {
    window.addEventListener("resize", resize_listener)
    
    resize_listener_registered = true
    resize_listener()

    const start_menu = document.getElementById("start_menu") as HTMLDivElement
    const start_button = document.getElementById("start_button") as HTMLButtonElement
    const username_input = document.getElementById("player_name") as HTMLInputElement

    username_input.value = current_player_data.username ?? ""
    start_menu.style.display = "flex"

    start_button.onclick = async () => {
        if (username_input.value.trim() === ""){
            alert("Please enter a username")
            return
        }

        start_menu.style.display = "none"

        main()
    }
}