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