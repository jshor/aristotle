module.exports = {
  base: '/vue-monorepo-boilerplate/',
  locales: {
    '/': {
      lang: 'en-US',
      title: 'vue-monorepo-boilerplate',
      description: 'Fullstack Vue App Monorepo Boilerplate'
    }
  },
  host: 'localhost',
  serviceWorker: true,
  themeConfig: {
    repo: 'slanatech/vue-monorepo-boilerplate',
    docsDir: 'docs',
    editLinks: true,
    sidebarDepth: 2,
    locales: {
      '/': {
        label: 'English',
        selectText: 'Languages',
        lastUpdated: 'Last Updated',
        editLinkText: 'Edit this page on GitHub',
        nav: [
          {
            text: 'Guide',
            link: '/guide/'
          },
          {
            text: 'Changelog',
            link: 'https://github.com/vue-monorepo-boilerplate/blob/dev/CHANGELOG.md'
          }
        ],
        sidebar: [
          {
            title: 'Documentation',
            path: '/docs/',
            sidebarDepth: 3,
            children: [
              {
                title: 'Editorrrrr',
                path: '/docs/editor/',
                children: [
                  '/docs/editor/reference/'
                ]
              }
            ]
          },
          
          // {
          //   title: 'Documentatssssion',
          //   path: '/docs/',
          //   sidebarDepth: 2,
          //   children: [
          //     {
          //       title: 'Editor',
          //       path: '/docs/editor/',
          //       // sidebarDepth: 2,
          //       children: [
          //         // '/docs/editor/'//,
          //         // {
          //         //   title: 'Reference',
          //         //   path: '/docs/editor/reference/',
          //         //   children: [
          //         //     '/docs/editor/reference/'
          //         //   ]
          //         // }
          //       ]
          //     }
          //   ]
          // }
          // {
          //   title: 'Group 1',
          //   collapsable: false,
          //   children: [
          //     '/guide/README.md'
          //   ]
          // }
        ]
        
        // {
        //   '/guide/': [
        //     '/guide/'
        //   ]
        // }
      }
    }
  }
}
