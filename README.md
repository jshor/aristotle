# Aristotle

The digital logic simulator.

### Monorepo Design

* Lerna and Yarn Workspaces to manage the monorepo
* Docs using Vuepress and Github pages

## Prerequisites

This project uses [Lerna](https://lernajs.io/) and [Yarn](https://yarnpkg.com/lang/en/) workspaces to manage packages in a monorepo design.

[vue-cli](https://cli.vuejs.org/) is used to bootstrap `@aristotle/aristotle`. `@aristotle/logic-circuit` is written in [TypeScript](https://www.typescriptlang.org/), and `@aristotle/editor` is written in ES6 and extends [Draw2D](https://draw2d.org).


## Quick start

```bash
# 1. Clone the repository.
git clone https://github.com/jshor/aristotle

# 2. Enter your newly-cloned folder
cd aristotle

# 3. Bootstrap
yarn run bootstrap

# 4. Run Build in all packages 
yarn run build

# 5. Dev: Run Server and in parallel start UI Serve with hot reload 
yarn run dev

```