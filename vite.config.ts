import path from 'node:path'
import VueI18n from '@intlify/unplugin-vue-i18n/vite'
import Shiki from '@shikijs/markdown-it'
import legacy from '@vitejs/plugin-legacy'
import Vue from '@vitejs/plugin-vue'
import LinkAttributes from 'markdown-it-link-attributes'
import Unocss from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import VueMacros from 'unplugin-vue-macros/vite'
import Markdown from 'unplugin-vue-markdown/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import VueDevTools from 'vite-plugin-vue-devtools'
import Layouts from 'vite-plugin-vue-layouts'
import generateSitemap from 'vite-ssg-sitemap'
import 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`,
      '@': path.join(__dirname, './src'),
    },
  },

  plugins: [
    VueMacros({
      plugins: {
        vue: Vue({
          include: [/\.vue$/, /\.md$/],
        }),
      },
    }),

    VueRouter({
      extensions: ['.vue', '.md'],
      dts: 'src/typed-router.d.ts',
    }),

    Layouts(),

    AutoImport({
      imports: [
        'vue',
        'vue-i18n',
        '@vueuse/head',
        '@vueuse/core',
        VueRouterAutoImports,
        {
          'vue-router/auto': ['useLink'],
        },
      ],
      dts: 'src/auto-imports.d.ts',
      dirs: [
        'src/composables',
        'src/stores',
      ],
      vueTemplate: true,
    }),

    Components({
      extensions: ['vue', 'md'],
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
      dts: 'src/components.d.ts',
    }),

    Unocss(),

    // Markdown({
    //   wrapperClasses: 'prose prose-sm m-auto text-left',
    //   headEnabled: true,
    //   async markdownItSetup(md) {
    //     md.use(LinkAttributes, {
    //       matcher: (link: string) => /^https?:\/\//.test(link),
    //       attrs: {
    //         target: '_blank',
    //         rel: 'noopener',
    //       },
    //     })
    //     md.use(await Shiki({
    //       defaultColor: false,
    //       themes: {
    //         light: 'vitesse-light',
    //         dark: 'vitesse-dark',
    //       },
    //     }))
    //   },
    // }),

    // VitePWA({
    //   registerType: 'autoUpdate',
    //   includeAssets: ['favicon.svg', 'safari-pinned-tab.svg'],
    //   manifest: {
    //     name: 'Vitesse',
    //     short_name: 'Vitesse',
    //     theme_color: '#ffffff',
    //     icons: [],
    //   },
    // }),

    VueI18n({
      runtimeOnly: true,
      compositionOnly: true,
      fullInstall: true,
      include: [path.resolve(__dirname, 'locales/**')],
    }),

    VueDevTools(),
    legacy({
      targets: ['firefox < 59', 'chrome < 60'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime', '@webcomponents/webcomponentsjs'],
      renderLegacyChunks: true,
      polyfills: [
        'es.symbol',
        'es.promise',
        'es.promise.finally',
        'es/map',
        'es/set',
        'es.array.filter',
        'es.array.for-each',
        'es.array.flat-map',
        'es.object.define-properties',
        'es.object.define-property',
        'es.object.get-own-property-descriptor',
        'es.object.get-own-property-descriptors',
        'es.object.keys',
        'es.object.to-string',
        'web.dom-collections.for-each',
        'esnext.global-this',
        'esnext.string.match-all',
      ],
      modernPolyfills: ['es.promise.all-settled', 'es.object.entries'],
    }),
  ],

  test: {
    include: ['test/**/*.test.ts'],
    environment: 'jsdom',
  },

  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    beastiesOptions: {
      reduceInlineStyles: false,
    },
    onFinished() {
      generateSitemap()
    },
  },

  ssr: {
    noExternal: ['workbox-window', /vue-i18n/],
  },

  server: {
    host: '0.0.0.0',
    proxy: {
      '/ai': {
        // target: 'http://39.170.17.192:9105',
        // target: 'http://39.175.132.230:35191',
        // target: 'http://39.170.17.192:9109',
        target: 'http://115.120.247.43:5003',
        changeOrigin: true,
        rewrite: path2 => path2.replace(/^\/ai/, ''),
      },

      '/backendApi': {
        // target: 'http://39.170.17.192:9105',
        // target: 'http://192.168.1.114:5999',
        // target: 'http://192.168.1.114:5999',
        // target: 'http://172.18.27.182:5999',
        target: 'http://47.99.166.37:5999',
        // target: 'http://192.168.1.100:5999',
        changeOrigin: true,
        rewrite: path2 => path2.replace(/^\/backendApi/, '/backendApi'),
      },
    },
  },

  build: {
    sourcemap: true,
    rollupOptions: {
      external: ['@webcomponents/webcomponentsjs'], // 确保在构建时处理 Web Components
    },
  },
})
