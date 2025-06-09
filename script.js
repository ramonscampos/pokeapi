document.addEventListener("DOMContentLoaded", () => {
	const loadingOverlay = document.getElementById("loadingOverlay");

	function showLoading() {
		loadingOverlay?.classList.add("visible");
	}

	function hideLoading() {
		loadingOverlay?.classList.remove("visible");
	}

	function getTypeColors(type) {
		return (
			getComputedStyle(document.documentElement)
				.getPropertyValue(`--type-color-${type}`)
				.trim() || "#888"
		);
	}

	async function fetchPokemonDetails(url) {
		try {
			const id = url.split("/").filter(Boolean).pop();

			if (!id) {
				console.error("Não foi possível obter o ID do Pokémon da URL: ", url);
				return null;
			}

			const response = await fetch(url);
			if (!response.ok) {
				console.error("Erro ao buscar dados da API para o Pokémon ID: ", id);
				return null;
			}

			const pokemon = await response.json();

			const types = await Promise.all(
				pokemon.types.map(async (type) => {
					const typeRes = await fetch(type.type.url);
					const typeData = await typeRes.json();

					return {
						name: typeData.name,
						color: getTypeColors(type.type.name),
					};
				}),
			);

			return {
				id,
				...pokemon,
				types,
			};
		} catch {}
	}

	async function fetchPokemons() {
		try {
			showLoading();

			const response = await fetch(
				"https://pokeapi.co/api/v2/pokemon?limit=251",
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			console.log(
				"POKEMON DETAILS => ",
				await fetchPokemonDetails(data.results[0].url),
			);
		} catch {
		} finally {
			hideLoading();
		}
	}

	fetchPokemons();
});
