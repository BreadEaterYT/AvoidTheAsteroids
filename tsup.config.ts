import { defineConfig } from "tsup"
import fs from "fs"
import path from "path"

const srcDir = path.resolve("src")
const outDir = path.resolve("public/js")

function getEntryFiles(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
            return getEntryFiles(fullPath)
        }

        if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            return [fullPath]
        }

        return []
    })
}

function renameGlobalFiles(dir: string) {
    if (!fs.existsSync(dir)) return

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
            renameGlobalFiles(fullPath)
            continue
        }

        if (!entry.name.endsWith(".global.js")) {
            continue
        }

        const newPath = path.join(
            dir,
            entry.name.replace(/\.global\.js$/, ".js"),
        )

        const oldMapName = `${entry.name}.map`
        const newMapName = `${path.basename(newPath)}.map`

        // Rename JS file
        fs.renameSync(fullPath, newPath)

        // Rename source map
        const oldMapPath = path.join(dir, oldMapName)
        const newMapPath = path.join(dir, newMapName)

        if (fs.existsSync(oldMapPath)) {
            fs.renameSync(oldMapPath, newMapPath)

            // Fix sourceMappingURL inside JS
            const data = fs.readFileSync(newPath, "utf8")

            fs.writeFileSync(
                newPath,
                data.replace(
                    `//# sourceMappingURL=${oldMapName}`,
                    `//# sourceMappingURL=${newMapName}`,
                ),
            )
        }
    }
}

export default defineConfig({
    entry: getEntryFiles(srcDir),

    minify: true,
    target: "es2015",
    sourcemap: true,
    format: ["iife"],
    injectStyle: true,

    clean: true,
    outDir,

    onSuccess: async () => {
        renameGlobalFiles(outDir)
    },

    esbuildOptions(options) {
        options.define = {
            "process.env.NODE_ENV": JSON.stringify("production"),
        }

        options.banner = {
            js: '"use client"',
        }
    },
})