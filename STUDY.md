#
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