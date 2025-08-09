const Database = require('better-sqlite3')
const { PrismaClient } = require('../src/generated/prisma') // ✅ 프로젝트 구조 맞춤

const prisma = new PrismaClient()

// -------- 설정값 --------
const BATCH = 1000
const DECIMAL_AS_STRING = process.env.DECIMAL_AS_STRING === '1'

// -------- 유틸 --------
function arg(key, def) {
  const i = process.argv.indexOf(key)
  return i > -1 ? process.argv[i + 1] : def
}

// SQLite 정수/문자열 타임스탬프 → JS Date 변환
function toDate(val) {
  if (val == null) return null
  if (typeof val === 'number') {
    // 초 단위(<=1e12)면 ms로 변환, 이미 ms(>1e12)면 그대로
    const ms = val > 1e12 ? val : val * 1000
    const d = new Date(ms)
    return isNaN(d.getTime()) ? null : d
  }
  // 문자열: ISO/일반 날짜 문자열 파싱 시도
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

// Decimal 스키마 대응: 필요 시 문자열로 변환
function toDecimal(val) {
  if (val == null) return null
  return DECIMAL_AS_STRING ? String(val) : val
}

// 페이지네이션 helper
function makePaginator(db, table, orderBy = 'id') {
  const stmt = db.prepare(`SELECT * FROM ${table} ORDER BY ${orderBy} LIMIT ? OFFSET ?`)
  return (skip) => stmt.all(BATCH, skip)
}

async function migrateTable(name, fetchPage, writer) {
  let skip = 0
  let total = 0
  for (;;) {
    const rows = fetchPage(skip)
    if (!rows.length) break
    await writer(rows)
    skip += rows.length
    total += rows.length
    console.log(`→ ${name}: ${total}`)
  }
}

async function main() {
  const sqlitePath = arg('--sqlite')
  if (!sqlitePath) {
    console.error('❌ Provide SQLite file path: node scripts/migrate-sqlite-file-to-mariadb.js --sqlite ./dev.db')
    process.exit(1)
  }

  console.log(`📦 Reading from SQLite: ${sqlitePath}`)
  const db = new Database(sqlitePath, { readonly: true })

  // ---- 1) 부모 → 자식 순서 (FK 무결성) ----
  // Decision
  await migrateTable(
    'Decision',
    makePaginator(db, 'Decision'),
    async (rows) => {
      const data = rows.map((r) => ({
        id: r.id,
        title: r.title,
        why: r.why,
        result: r.result,
        createdAt: toDate(r.createdAt), // DateTime 변환
        // updatedAt은 @updatedAt이면 DB에서 자동 세팅됨
      }))
      if (data.length) {
        await prisma.decision.createMany({ data, skipDuplicates: true })
      }
    }
  )

  // Judgment
  await migrateTable(
    'Judgment',
    makePaginator(db, 'Judgment'),
    async (rows) => {
      const data = rows.map((r) => ({
        id: r.id,
        decisionId: r.decisionId,
        verdict: r.verdict,
        category: r.category, // enum 문자열 그대로
        weight: r.weight,
        why: r.why,
        updatedAt: toDate(r.updatedAt),
      }))
      if (data.length) {
        await prisma.judgment.createMany({ data, skipDuplicates: true })
      }
    }
  )

  // ---- 2) DepositProduct → DemandDepositTransaction ----
  await migrateTable(
    'DepositProduct',
    makePaginator(db, 'DepositProduct'),
    async (rows) => {
      const data = rows.map((r) => ({
        id: r.id,
        name: r.name,
        userName: r.userName,
        category: r.category,
        interest: toDecimal(r.interest), // Decimal 스키마면 문자열로 삽입 가능
        useInterest: !!r.useInterest,
        initialDeposit: r.initialDeposit,
        monthlyDeposit: r.monthlyDeposit,
        totalDeposited: r.totalDeposited,
        totalInstallments: r.totalInstallments,
        paidInstallments: r.paidInstallments,
        maturityAt: toDate(r.maturityAt),
        isMatured: !!r.isMatured,
        profit: r.profit,
        createdAt: toDate(r.createdAt),
      }))
      if (data.length) {
        await prisma.depositProduct.createMany({ data, skipDuplicates: true })
      }
    }
  )

  await migrateTable(
    'DemandDepositTransaction',
    makePaginator(db, 'DemandDepositTransaction'),
    async (rows) => {
      const data = rows.map((r) => ({
        id: r.id,
        startAt: toDate(r.startAt),
        endAt: toDate(r.endAt),
        totalDeposited: r.totalDeposited,
        interest: toDecimal(r.interest),
        useInterest: !!r.useInterest,
        profit: r.profit,
        depositProductId: r.depositProductId,
        createdAt: toDate(r.createdAt),
      }))
      if (data.length) {
        await prisma.demandDepositTransaction.createMany({ data, skipDuplicates: true })
      }
    }
  )

  // ---- 3) Freqtrade ----
  await migrateTable(
    'Freqtrade',
    makePaginator(db, 'Freqtrade', 'createdAt'),
    async (rows) => {
      const data = rows.map((r) => ({
        id: r.id, // String PK (uuid/cuid/직접키)
        strategy: r.strategy,
        exchange: r.exchange,
        coin: r.coin,
        buyQty: r.buyQty,
        sellQty: r.sellQty,
        buyPrice: r.buyPrice,
        sellPrice: r.sellPrice,
        tradedAt: toDate(r.tradedAt),
        createdAt: toDate(r.createdAt),
      }))
      if (data.length) {
        await prisma.freqtrade.createMany({ data, skipDuplicates: true })
      }
    }
  )

  // ---- 4) CoinTimeline ----
  await migrateTable(
    'CoinTimeline',
    makePaginator(db, 'CoinTimeline'),
    async (rows) => {
      const data = rows.map((r) => ({
        id: r.id,
        coin: r.coin,
        yyyymmdd: r.yyyymmdd, // 문자열
        close: r.close,
        volume: r.volume,
        rsi: r.rsi,
        ema15: r.ema15,
        ema50: r.ema50,
        ema100: r.ema100,
        cross15: !!r.cross15,
        cross50: !!r.cross50,
      }))
      if (data.length) {
        await prisma.coinTimeline.createMany({ data, skipDuplicates: true })
      }
    }
  )

  db.close()
  await prisma.$disconnect()
  console.log('✅ Migration finished.')
}

main().catch(async (e) => {
  console.error('❌ Error:', e)
  await prisma.$disconnect()
  process.exit(1)
})
