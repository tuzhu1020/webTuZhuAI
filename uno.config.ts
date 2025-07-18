import presetRemToPx from "@unocss/preset-rem-to-px";
import { createLocalFontProcessor } from "@unocss/preset-web-fonts/local";
import {
    defineConfig,
    type Preset,
    presetAttributify,
    presetIcons,
    presetTypography,
    presetUno,
    presetWebFonts,
    transformerDirectives,
    transformerVariantGroup,
} from "unocss";

export default defineConfig({
    shortcuts: [
        [
            "btn",
            "px-4 py-1 rounded inline-block bg-teal-700 text-white cursor-pointer !outline-none hover:bg-teal-800 disabled:cursor-default disabled:bg-gray-600 disabled:opacity-50",
        ],
        [
            "icon-btn",
            "inline-block cursor-pointer select-none opacity-75 transition duration-200 ease-in-out hover:opacity-100 hover:text-teal-600",
        ],
        ["scrollbar-hide", "overflow-auto"],
        ["btn", "py-2 px-4 rounded cursor-pointer transition"],
        ["btn-primary", "btn bg-teal-600 hover:bg-teal-700 text-white"],
        ["btn-disabled", "btn bg-gray-300 cursor-not-allowed"],
    ],
    rules: [
        ["scrollbar-hide", { "scrollbar-width": "none" }],
        ["scrollbar-hide", { "-webkit-scrollbar": "none" }],
    ],
    presets: [
        presetUno(),
        presetAttributify(),
        presetIcons({
            scale: 1.2,
        }),
        presetTypography(),
        presetWebFonts({
            fonts: {
                sans: "DM Sans",
                serif: "DM Serif Display",
                mono: "DM Mono",
            },
            processors: createLocalFontProcessor(),
        }),
        presetRemToPx({
            baseFontSize: 4,
        }) as Preset,
    ],
    transformers: [transformerDirectives(), transformerVariantGroup()],
    safelist: "prose prose-sm m-auto text-left scrollbar-hide".split(" "),
});
