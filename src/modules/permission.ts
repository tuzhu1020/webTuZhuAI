import type { UserModule } from "@/types";

import { useUserStore } from "@/stores/user";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import NProgress from "nprogress";

export const install: UserModule = ({ isClient, router, app }) => {
    if (isClient) {
        const pinia = createPinia();
        pinia.use(piniaPluginPersistedstate);
        app.use(pinia);
        router.beforeEach(async (to, from) => {
            const userStore = useUserStore();
            NProgress.start();
            const token = userStore.token;
            const requiresAuth = to.meta.requiresAuth !== false;

            if (!token && requiresAuth) {
                return {
                    path: "/login",
                    query: { redirect: to.fullPath },
                };
            }
            if (token && to.path === "/login") {
                return { path: "/" };
            }

            return true;
        });

        router.afterEach(() => {
            NProgress.done();
        });
    }
};
