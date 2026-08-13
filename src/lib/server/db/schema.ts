import { sqliteTable, text, integer, real, primaryKey, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Better Auth tables — the shape Better Auth expects (user/session/account).
// The extra fields after the auth ones belong to the app.
export const users = sqliteTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull().default(''),
	email: text('email').notNull().unique(),
	emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull().default(false),
	image: text('image'),
	// TabelaInvest's own fields
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// Better Auth sessions — each login creates one, with a token and an expiry.
export const sessions = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('userId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	token: text('token').notNull().unique(),
	ipAddress: text('ipAddress'),
	userAgent: text('userAgent'),
	expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// Better Auth auth accounts — one entry per provider (email/password, OAuth).
// Named "accounts" (plural) because that is the name Better Auth looks for
// with usePlural: true.
export const authAccounts = sqliteTable('accounts', {
	id: text('id').primaryKey(),
	userId: text('userId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	accountId: text('accountId').notNull(),
	providerId: text('providerId').notNull(),
	password: text('password'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// AI BYOK — the user's own provider/model/api key, encrypted (PLANO.md §IA).
export const aiCredentials = sqliteTable('ai_credentials', {
	userId: text('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	provider: text('provider').notNull(),
	model: text('model').notNull(),
	keyEncrypted: text('key_encrypted').notNull(),
	nonce: text('nonce').notNull(),
	// Encryption scheme version — see server/crypto.ts. Null means v1, written
	// before the field existed.
	v: integer('v')
});

// The asset universe — stocks (ações) and REITs (FIIs) pulled from the
// investidor10 sitemaps. `company_id`/`ticker_id` are the numeric ids the
// investidor10 internal API needs (PLANO.md §Camada de dados).
export const assets = sqliteTable('assets', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	// 'acao' | 'fii'
	type: text('type').notNull(),
	ticker: text('ticker').notNull().unique(),
	name: text('name').notNull(),
	companyId: integer('company_id'),
	tickerId: integer('ticker_id'),
	// Ações: setor/segmento/subsetor. FIIs: segmento/tipo.
	sector: text('sector'),
	segment: text('segment'),
	subsector: text('subsector'),
	// FIIs: 'Fundo de Tijolo' | 'Fundo de Papel' | ...
	fiiType: text('fii_type'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// Latest quote per asset — refreshed by the daily cron via the batch endpoint.
export const quotes = sqliteTable('quotes', {
	assetId: text('asset_id')
		.primaryKey()
		.references(() => assets.id, { onDelete: 'cascade' }),
	price: real('price').notNull().default(0),
	variation30d: real('variation_30d'),
	variation12m: real('variation_12m'),
	variation5y: real('variation_5y'),
	lastUpdate: integer('last_update', { mode: 'timestamp' })
});

// Fundamental indicators for stocks (ações) — one row per asset per year.
// The column names match the investidor10 ranking keys (PLANO.md §Endpoints).
export const indicators = sqliteTable(
	'indicators',
	{
		assetId: text('asset_id')
			.notNull()
			.references(() => assets.id, { onDelete: 'cascade' }),
		year: text('year').notNull(), // 'Atual' | '2025' | '2024' ...
		p_l: real('p_l'),
		p_vp: real('p_vp'),
		roe: real('roe'),
		netMargin: real('net_margin'),
		dy12m: real('dy_12m'),
		dy5y: real('dy_5y'),
		bazinPrice: real('bazin_price'),
		grahamPrice: real('graham_price'),
		bazinUpside: real('bazin_upside'),
		grahamUpside: real('graham_upside'),
		growthNetProfit5y: real('growth_net_profit_5y'),
		growthNetRevenue5y: real('growth_net_revenue_5y'),
		netWorth: real('net_worth'),
		netRevenue: real('net_revenue'),
		netProfit: real('net_profit'),
		enterpriseValue: real('enterprise_value'),
		grossDebtNetWorth: real('gross_debt_net_worth'),
		lpa: real('lpa'),
		vpa: real('vpa'),
		payout: real('payout'),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [
		primaryKey({ columns: [table.assetId, table.year] }),
		uniqueIndex('indicators_asset_year').on(table.assetId, table.year)
	]
);

// REIT (FII) indicators — a different set from stocks. Refreshed by the cron
// via the `/api/fii/comparador/table/{companyId}/all/` endpoint.
export const fiiIndicators = sqliteTable('fii_indicators', {
	assetId: text('asset_id')
		.primaryKey()
		.references(() => assets.id, { onDelete: 'cascade' }),
	p_vp: real('p_vp'),
	dividendYield: real('dividend_yield'),
	netWorth: real('net_worth'),
	// Vacância (vacancy rate), % — via /api/fii/historico-taxa-vacancia/.
	vacancy: real('vacancy'),
	last12mDividends: real('last_12m_dividends'),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// Dividend payments (proventos) — per asset, one row per payment.
export const dividends = sqliteTable(
	'dividends',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		assetId: text('asset_id')
			.notNull()
			.references(() => assets.id, { onDelete: 'cascade' }),
		// Date the position must be held to receive the payment.
		exDate: integer('ex_date', { mode: 'timestamp' }),
		payDate: integer('pay_date', { mode: 'timestamp' }),
		value: real('value'),
		// 'dividendo' | 'jcp' | 'rendimento' ...
		type: text('type'),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [uniqueIndex('dividends_asset_ex_value').on(table.assetId, table.exDate, table.value)]
);

// User watchlist — many-to-many between users and assets.
export const watchlist = sqliteTable(
	'watchlist',
	{
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		assetId: text('asset_id')
			.notNull()
			.references(() => assets.id, { onDelete: 'cascade' }),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [primaryKey({ columns: [table.userId, table.assetId] })]
);

// Saved screener filters — the filter config (and chosen strategy/scoring
// weights) serialized as JSON, so the user can reload a filter later.
export const savedFilters = sqliteTable('saved_filters', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	filterJson: text('filter_json').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});
