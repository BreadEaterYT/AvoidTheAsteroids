export type vec2 = [number, number]

export function vec2_normalize(pixel: vec2, canvas_size: vec2): vec2 {
    return [pixel[0] / canvas_size[0], pixel[1] / canvas_size[1]] 
}

export function vec2_scale(normalized: vec2, canvas_size: vec2): vec2 {
    return [normalized[0] * canvas_size[0], normalized[1] * canvas_size[1]] 
}