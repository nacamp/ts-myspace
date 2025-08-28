# prettier, eslint

- install

```bash
yarn add -D prettier
yarn add -D eslint @eslint/js typescript-eslint globals \
eslint-plugin-prettier eslint-config-prettier
```

- settings.json

```js
{
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": "explicit"
    },
}
```

- .prettierrc.json

```js
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 120
}
```

- eslint.config.mjs

```js
// eslint.config.mjs
// @ts-check
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  // 0) 무시 경로
  { ignores: ['.next/**', 'node_modules/**', 'dist/**', 'coverage/**'] },

  // 1) JS 권장
  js.configs.recommended,

  // 2) TS 권장 (⚠️ 타입체크 없는 버전: 설정 간단, 빠름)
  ...tseslint.configs.recommended,

  // 3) Prettier 권장(충돌 룰 off + 포맷 이슈 경고)
  prettierRecommended,

  // 4) 공통 옵션/규칙
  {
    languageOptions: {
      parserOptions: {
        // 타입체크 없는 구성이라 projectService 불필요 (간단/안정)
        // 타입체크 기반 규칙을 쓰려면 아래 '옵션 A' 참고
      },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // 경고 위주
      'no-console': 'warn',

      // TS 쪽은 JS 기본 룰 끄고 TS 룰만 사용
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      '@typescript-eslint/no-explicit-any': 'warn',
      'prettier/prettier': 'warn',
    },
  },
);
```

# debugging

- launch - F5

```bash
vi .vscode/settings.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Next.js",
      "runtimeExecutable": "yarn",
      "runtimeArgs": ["dev"],
      "port": 9229,
      "env": {
        "NODE_OPTIONS": "--inspect"
      },
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector",
      "skipFiles": ["<node_internals>/**"]
    },
  ]
}
```

# sqlite -> mariadb

## create shadow db

```bash
>sudo mysql
CREATE DATABASE IF NOT EXISTS `nacamp_shadow` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON nacamp_shadow.* TO '?'@'%' IDENTIFIED BY '?';
FLUSH PRIVILEGES;
exit
```

##

## setting

```
vi .env
DATABASE_URL="mysql://user:password$@ip:3306/nacamp"
SHADOW_DATABASE_URL="mysql://user:password$@ip:3306/nacamp_shadow"

vi schema.prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}
```

## delete migration history and migrate

```bash
mv prisma/migrations prisma/migrations_sqlite_backup
rm -f prisma/migration_lock.toml
yarn prisma migrate dev --name init_mysql
```

## migrate db

```bash
yarn add better-sqlite3
export DATABASE_URL='mysql://user:password@ip:3306/databasename'
node scripts/migrate-sqlite-file-to-mariadb.js --sqlite /Users/jimmy/Downloads/db.sqlite
```

## after git pull ...

```bash
yarn prisma generate
```

# etc

node src/cli/saveCoinTimeline.js "2025-07-26 BTC-rsi: 60.52, Close: 160217000.0, 15:159441859, 50:152990656, 100:148584276, cross: False-False, ETH-rsi: 79.94, Close: 5078000.0, 15:4683264, 50:4021623, 100:3770132, cross: False-False, SOL-rsi: 62.09, Close: 254700.0, 15:243536, 50:225325, 100:226180, cross: False-False, XRP-rsi: 60.72, Close: 4280.0, 15:4246, 50:3665, 100:3508, cross: False-False"

# [id] path 적용

- https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes

# Partial을 이용한 인자값 사용

```
type DepositRowProps = {
  row: Partial<DemandDepositTransaction>;
  isNew?: boolean;
  index?: number;
  onChange?: (row: Partial<DemandDepositTransaction>) => void;
};
```

# shadcn

- https://ui.shadcn.com
- https://www.google.com/search?client=safari&rls=en&q=shadcn%2Fui&ie=UTF-8&oe=UTF-8
- https://pyjun01.github.io/v/shadcn-ui/

```
yarn dlx shadcn@latest add sonner
...
```

# tailwindcss

tailwindcss 변경사항
https://velog.io/@oneook/tailwindcss-4.0-무엇이-달라졌나요

# prisma

```bash
yarn add  @prisma/client
yarn add --dev prisma #yarn add -D prisma
yarn prisma init --datasource-provider sqlite

vi .env
DATABASE_URL="file:../db/dev.db"

vi schema.prisma
model Freqtrade {
  id        String   @id @default(uuid())
  exchange  String
  coin      String
  buyQty    Float
  sellQty   Float
  buyPrice  Float
  sellPrice Float
  createdAt DateTime @default(now())
}

yarn prisma migrate dev --name Freqtrade
yarn prisma studio

vi lib/prisma.ts
참고
https://pris.ly/d/getting-started
https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases-typescript-mysql
https://www.prisma.io/docs/guides/nextjs
```
