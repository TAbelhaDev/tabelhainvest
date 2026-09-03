<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import ChartLineIcon from '@lucide/svelte/icons/chart-line';
	import CodeXmlIcon from '@lucide/svelte/icons/code-xml';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
	import StarIcon from '@lucide/svelte/icons/star';
	import TableIcon from '@lucide/svelte/icons/table';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import { Button, Landing, Wordmark } from '@tabelhadev/tabelhawebui';
	import { PUBLIC_TABELHAUTH_URL } from '$env/static/public';

	const REPO_URL = 'https://github.com/TAbelhaDev/tabelainvest';

	const TITLE = 'TabelaInvest: ações e FIIs da B3 sem mistério';
	const DESCRIPTION =
		'Garimpe ações e FIIs pelos indicadores (P/L, ROE, dividend yield), filtre e compare numa tabela direta. Recomendação por regras ou pela sua própria chave de IA.';

	const canonical = $derived(`${page.url.origin}${page.url.pathname}`);

	const steps = [
		{
			number: '01',
			color: 'var(--ctp-mauve)',
			title: 'O universo entra',
			body: 'Os dados das ações e FIIs da B3 (cotações, indicadores, dividendos) sincronizam sozinhos.'
		},
		{
			number: '02',
			color: 'var(--ctp-sapphire)',
			title: 'Você filtra',
			body: 'P/L, P/VP, ROE, dividend yield, crescimento, setor e segmento: cada um com seus limites.'
		},
		{
			number: '03',
			color: 'var(--ctp-peach)',
			title: 'A tabela responde',
			body: 'Comparação lado a lado, ordenação por qualquer indicador e score por regras transparentes.'
		},
		{
			number: '04',
			color: 'var(--ctp-green)',
			title: 'Você decide',
			body: 'Recomendação por filtro manual, estratégias prontas (Bazin, Graham, top-DY) ou pela sua própria chave de IA. Sem caixa preta.'
		}
	];

	const features = [
		{
			icon: keyIcon,
			iconBg: 'color-mix(in srgb, var(--ctp-mauve) 12%, transparent)',
			iconColor: 'var(--ctp-mauve)',
			title: 'IA opcional, regras sempre',
			body: 'Sem API key, o TabelaInvest recomenda por regras transparentes. Com a sua chave, você escolhe o provedor e o modelo, e paga direto pra eles.'
		},
		{
			icon: shieldIcon,
			iconBg: 'color-mix(in srgb, var(--ctp-sapphire) 12%, transparent)',
			iconColor: 'var(--ctp-sapphire)',
			title: 'Seus dados, seu banco',
			body: 'Sua chave de IA fica criptografada. Os dados de mercado são públicos e ficam na sua conta.'
		},
		{
			icon: tableIcon,
			iconBg: 'color-mix(in srgb, var(--ctp-green) 12%, transparent)',
			iconColor: 'var(--ctp-green)',
			title: 'Tabela direta',
			body: 'Ordem, filtra e seleciona numa tabela de verdade. Sem gráficos empurrados: os números primeiro.'
		},
		{
			icon: filterIcon,
			iconBg: 'color-mix(in srgb, var(--ctp-peach) 12%, transparent)',
			iconColor: 'var(--ctp-peach)',
			title: 'Filtros honestos',
			body: 'Cada indicador com seu limite mínimo e máximo, e multi-select de setor e segmento. Você entende por que cada ativo apareceu.'
		},
		{
			icon: trendingUpIcon,
			iconBg: 'color-mix(in srgb, var(--ctp-yellow) 12%, transparent)',
			iconColor: 'var(--ctp-yellow)',
			title: 'Estratégias clássicas',
			body: 'Bazin, Graham e top dividend yield prontos pra aplicar. Recomendação por regras, não por opinião.'
		},
		{
			icon: starIcon,
			iconBg: 'color-mix(in srgb, var(--ctp-blue) 12%, transparent)',
			iconColor: 'var(--ctp-blue)',
			title: 'Watchlist e filtros salvos',
			body: 'Guarda os ativos que te interessam e refaz o mesmo filtro quando quiser.'
		}
	];

	const roadmap = [
		{ icon: slidersIcon, label: 'Scoring por regras configurável' },
		{ icon: chartIcon, label: 'Gráfico de preço e proventos no detalhe' },
		{ icon: sparklesIcon, label: 'Análise por IA do conjunto filtrado' }
	];
</script>

{#snippet heroTitle()}
	<Wordmark prefix="Tabela" suffix="Invest" />
{/snippet}

{#snippet keyIcon()}
	<KeyRoundIcon class="twui-landing-feature-svg" />
{/snippet}
{#snippet shieldIcon()}
	<ShieldCheckIcon class="twui-landing-feature-svg" />
{/snippet}
{#snippet tableIcon()}
	<TableIcon class="twui-landing-feature-svg" />
{/snippet}
{#snippet filterIcon()}
	<FilterIcon class="twui-landing-feature-svg" />
{/snippet}
{#snippet trendingUpIcon()}
	<TrendingUpIcon class="twui-landing-feature-svg" />
{/snippet}
{#snippet starIcon()}
	<StarIcon class="twui-landing-feature-svg" />
{/snippet}

{#snippet slidersIcon()}
	<SlidersHorizontalIcon class="twui-landing-roadmap-icon" />
{/snippet}
{#snippet chartIcon()}
	<ChartLineIcon class="twui-landing-roadmap-icon" />
{/snippet}
{#snippet sparklesIcon()}
	<StarIcon class="twui-landing-roadmap-icon" />
{/snippet}

<svelte:head>
	<title>{TITLE}</title>
	<meta name="description" content={DESCRIPTION} />
	<link rel="canonical" href={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="TabelaInvest" />
	<meta property="og:locale" content="pt_BR" />
	<meta property="og:title" content={TITLE} />
	<meta property="og:description" content={DESCRIPTION} />
	<meta property="og:url" content={canonical} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={TITLE} />
	<meta name="twitter:description" content={DESCRIPTION} />
</svelte:head>

<Landing>
	<Landing.Hero
		eyebrow="Garimpo de ações e FIIs da B3"
		title={heroTitle}
		lead="O TabelaInvest puxa os indicadores do investidor10, filtra e compara numa tabela direta. Recomendação por regras transparentes ou pela sua própria IA. Sem assinatura, sem caixa preta."
		note="Dados públicos sincronizados todo dia. IA e estratégias configuráveis se você quiser."
	>
		{#snippet actions()}
			<Button href="{PUBLIC_TABELHAUTH_URL}/signup" variant="primary" size="lg">Começar</Button>
			<Button href={REPO_URL} target="_blank" rel="noreferrer" variant="outline" size="lg">
				<CodeXmlIcon class="size-4" />
				Ver o código
			</Button>
		{/snippet}
	</Landing.Hero>

	<Landing.Section>
		<Landing.Section.Heading eyebrow="Como funciona" title="Quatro passos do universo à decisão." />
		<Landing.Steps {steps} />
	</Landing.Section>

	<Landing.Section>
		<Landing.Section.Heading
			eyebrow="Recursos"
			title="O que ele faz e o que ele não faz com os seus dados."
		/>
		<Landing.Features {features} />
	</Landing.Section>

	<Landing.Section>
		<Landing.Section.Heading
			eyebrow="No radar"
			title="O que vem depois."
			lead="Nada disso existe ainda. Tá aqui porque o roadmap é público: igual o código."
		/>
		<Landing.Roadmap items={roadmap} />
	</Landing.Section>
</Landing>
