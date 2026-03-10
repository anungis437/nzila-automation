# @nzila/config

Shared configuration presets for the NzilaOS monorepo.

## Exports

| Import Path | Content |
|-------------|---------|
| `@nzila/config/tsconfig/base` | Base TypeScript configuration |
| `@nzila/config/tsconfig/nextjs` | Next.js TypeScript configuration |
| `@nzila/config/eslint` | Shared ESLint configuration |
| `@nzila/config/eslint-no-direct-provider` | ESLint rules prohibiting direct provider imports |
| `@nzila/config/prettier` | Shared Prettier configuration |

## Usage

```json
// tsconfig.json
{
  "extends": "@nzila/config/tsconfig/nextjs"
}
```

```js
// .eslintrc.js
module.exports = require('@nzila/config/eslint')
```
