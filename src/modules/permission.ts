import type { UserModule } from '@/types'

import { useUserStore } from '@/stores/user'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

export const install: UserModule = ({ isClient, router, app }) => {
  if (isClient) {
    const pinia = createPinia()
    pinia.use(piniaPluginPersistedstate)
    app.use(pinia)
    const userStore = useUserStore()
    router.beforeEach(async (to) => {
      const token = userStore.token
      if (!token) {
        !to.query.code ? await userStore.redirectHMD() : await userStore.getUserInfo(to.query.code as string)
      }
      // else {
      // }
      // if (to.path === '/' && to.query.code) {
      //   await userStore.getUserInfo(to.query.code as string)
      // } else {

      // }
    })
  }
}
