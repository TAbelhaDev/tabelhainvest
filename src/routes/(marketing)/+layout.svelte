<script lang="ts">
	import { MarketingShell, Button } from '@tabelhadev/tabelhawebui';
	import { PUBLIC_TABELHAUTH_URL, PUBLIC_APP_URL } from '$env/static/public';

	let { children } = $props();
</script>

<MarketingShell
	suffix="Invest"
	footerLinks={[
		{ href: `${PUBLIC_TABELHAUTH_URL}/privacidade`, label: 'Privacidade' },
		{ href: `${PUBLIC_TABELHAUTH_URL}/termos`, label: 'Termos de uso' },
		{ href: 'https://github.com/TAbelhaDev/tabelainvest', label: 'Código-fonte' }
	]}
	footerLicense="AGPL-3.0 · SvelteKit + Cloudflare Workers"
>
	{#snippet actions()}
		<Button
			href="{PUBLIC_TABELHAUTH_URL}/login?redirect={encodeURIComponent(PUBLIC_APP_URL)}"
			variant="ghost"
			size="sm">Entrar</Button
		>
	{/snippet}
	{@render children()}
</MarketingShell>
