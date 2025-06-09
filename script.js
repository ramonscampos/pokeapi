document.addEventListener("DOMContentLoaded", () => {
	const pokemonGrid = document.getElementById("pokemonGrid");
	const loadingOverlay = document.getElementById("loadingOverlay");

	let allPokemons = [];

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
		} catch (err) {
			console.error("Erro ao buiscar detalhes do Pokémon:", err);
			return null;
		}
	}

	function getPokemonImage(pokemon) {
		const officialArt =
			pokemon.sprites.other["official-artwork"]?.front_default;
		const defaultSprite = pokemon.sprites?.front_default;

		return officialArt || defaultSprite;
	}

	function createPokemonCard(pokemon) {
		const card = document.createElement("div");
		card.className = "pokemon-card";
		card.dataset.id = pokemon.id;

		const img = document.createElement("img");
		img.loading = "lazy";
		img.alt = pokemon.name;
		img.src = getPokemonImage(pokemon);

		const title = document.createElement("h3");
		title.textContent = pokemon.name;

		card.appendChild(img);
		card.appendChild(title);

		return card;
	}

	function renderPokemonGrid(pokemons) {
		pokemonGrid.innerHTML = "";
		const fragment = document.createDocumentFragment();

		for (const pokemon of pokemons) {
			const card = createPokemonCard(pokemon);
			fragment.appendChild(card);
		}

		pokemonGrid.appendChild(fragment);
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

			const pokemonDetails = await Promise.all(
				data.results.map(async (pokemon) => {
					const details = await fetchPokemonDetails(pokemon.url);
					return details;
				}),
			);

			allPokemons = pokemonDetails.filter(Boolean);
			renderPokemonGrid(allPokemons);
		} catch (err) {
			console.error("Erro ao buscar Pokémon:", err);
		} finally {
			hideLoading();
		}
	}

	fetchPokemons();
});
