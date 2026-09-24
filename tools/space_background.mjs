import fs from "fs"

const tileSize = 16
const columns = 120
const rows = 68

const colors = {
    darkBlue: "#0a1222",
    variations: ["#0b1323", "#0b1424", "#0a1323", "#0c1425", "#0a1223", "#0b1324"],
    star: "#ffffff"
}

const random = (min, max) => {
    return Math.random() * (max - min) + min
}

const randomVariation = () => {
    return colors.variations[Math.floor(Math.random() * colors.variations.length)]
}

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${columns * tileSize}" height="${rows * tileSize}" viewBox="0 0 ${columns * tileSize} ${rows * tileSize}" shape-rendering="crispEdges">\n<rect width="100%" height="100%" fill="${colors.darkBlue}"/>\n`

for (let y = 0; y < rows; y++){
    for (let x = 0; x < columns; x++){
        const chance = Math.random()

        const px = x * tileSize
        const py = y * tileSize

        if (chance < 0.10){
            let starSize = 2

            const starX = px + Math.floor(random(2, tileSize - starSize - 2))
            const starY = py + Math.floor(random(2, tileSize - starSize - 2))

            svg += `<rect x="${starX}" y="${starY}" width="${starSize}" height="${starSize}" fill="${colors.star}"/>\n`
        } else if (chance < 0.55) svg += `<rect x="${px}" y="${py}" width="${tileSize}" height="${tileSize}" fill="${randomVariation()}"/>\n`
    }
}

svg += `</svg>`

fs.writeFileSync("./space-background.svg", svg)

console.log("Generated space-background.svg")
