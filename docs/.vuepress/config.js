const path = require('path')

module.exports = {
  base: '/',
  dest: path.join(__dirname, '../../build'),
  locales: {
    '/': {
      lang: 'en-US',
      title: 'Aristotle',
      description: 'The digital logic simulator'
    }
  },
  host: 'localhost',
  serviceWorker: true,
  themeConfig: {
    logo: '/assets/logo.svg',
    repo: 'jshor/aristotle',
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
          }
        ],
        sidebar: [
          {
            title: 'Guide',
            path: '/guide/'
          }
          /*
          {
            title: 'Documentation',
            path: '/docs/',
            sidebarDepth: 3,
            children: [
              {
                title: 'Circuit',
                path: '/docs/circuit/',
                children: [
                  '/docs/circuit/classes/'
                ]
              }
            ]
          }
          */
        ]
      }
    }
  }
}
