import type { UserModule } from "./types";

import { setupLayouts } from "virtual:generated-layouts";

import { ViteSSG } from "vite-ssg";
import { routes } from "vue-router/auto-routes";
import App from "./App.vue";
import "web-streams-polyfill";
import "abortcontroller-polyfill/dist/abortcontroller-polyfill-only";

// import '@unocss/reset/tailwind.css'
import "@/assets/styles/main.css";
import "ant-design-vue/dist/reset.css";
import "uno.css";

// https://github.com/antfu/vite-ssg
export const createApp = ViteSSG(
    App,
    {
        routes: setupLayouts(routes),
        base: import.meta.env.BASE_URL,
    },
    (ctx) => {
        // install all modules under `modules/`
        Object.values(
            import.meta.glob<{ install: UserModule }>("./modules/*.ts", {
                eager: true,
            }),
        ).forEach((i) => i.install?.(ctx));
        // ctx.app.use(Previewer)
    },
);
