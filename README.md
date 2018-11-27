# Aristotle

The digital logic simulator.

### Monorepo Design

* Lerna and Yarn Workspaces to manage monorepo
* Docs using Vuepress and Github pages

## Prerequisites

This project uses [Lerna](https://lernajs.io/) and [Yarn](https://yarnpkg.com/lang/en/) workspaces to manage packages in a monorepo design.

[vue-cli](https://cli.vuejs.org/) is used in for `@aristotle/aristotle`, along with [TypeScript](https://www.typescriptlang.org/) in all packages. It's recommended that you install [Lerna](https://lernajs.io/), [Yarn](https://yarnpkg.com/en/docs/install) and [vue-cli](https://cli.vuejs.org/) globally.


## Quick start

```bash
# 1. Clone the repository.
git clone https://github.com/jshor/aristotle.git

# 2. Enter your newly-cloned folder
cd my-new-project

# 3. Bootstrap
yarn bootstrap

# 4. Start the dev server
yarn start

```