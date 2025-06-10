document.addEventListener("DOMContentLoaded", () => {
	const pokemonGrid = document.getElementById("pokemonGrid");
	const header = document.querySelector(".main-header");
	const searchInput = document.getElementById("searchInput");
	const clearSearch = document.getElementById("clearSearch");
	const modalBody = document.querySelector(".modal-body");
	const modal = document.getElementById("pokemonModal");
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

			const abilities = await Promise.all(
				pokemon.abilities.map(async (ability) => {
					const abilityRes = await fetch(ability.ability.url);
					const abilityData = await abilityRes.json();
					return abilityData.name;
				}),
			);

			return {
				id,
				...pokemon,
				types,
				abilities,
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

	function showPokemonDetails(pokemon) {
		console.log(pokemon);
		modalBody.innerHTML = `
            <img src="${getPokemonImage(pokemon)}" alt="${pokemon.name}">
            <h2>${pokemon.name}</h2>
            <div class="pokemon-details">
                <div class="detail-item">
                    <strong>Height</strong>
                    ${(pokemon.height / 10).toFixed(1)}m
                </div>
                <div class="detail-item">
                    <strong>Weight</strong>
                    ${(pokemon.weight / 10).toFixed(1)}m
                </div>
                <div class="detail-item">
                    <strong>Types</strong>
                    ${pokemon.types.map((type) => type.name).join(", ")}
                </div>
                <div class="detail-item">
                    <strong>Abilities</strong>
                    ${pokemon.abilities.join(", ")}
                </div>
                <div class="detail-item">
                    <strong>HP</strong>
                    ${pokemon.stats[0].base_stat}
                </div>
                <div class="detail-item">
                    <strong>Attack</strong>
                    ${pokemon.stats[1].base_stat}
                </div>
                <div class="detail-item">
                    <strong>Defense</strong>
                    ${pokemon.stats[2].base_stat}
                </div>
                <div class="detail-item">
                    <strong>Speed</strong>
                    ${pokemon.stats[5].base_stat}
                </div>
            </div>
        `;

		modal.style.display = "flex";
		setTimeout(() => modal.classList.add("active"), 10);
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

		const typesDiv = document.createElement("div");
		typesDiv.className = "pokemon-types";
		typesDiv.innerHTML = pokemon.types
			.map(
				(type) => `
            <span class="type-badge" style="background-color: ${type.color}">
                ${type.name}
            </span>    
        `,
			)
			.join("");

		card.appendChild(img);
		card.appendChild(title);
		card.appendChild(typesDiv);

		card.addEventListener("click", () => showPokemonDetails(pokemon));

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

	window.addEventListener("scroll", () => {
		if (window.scrollY > 32) {
			header.style.borderTopLeftRadius = "0";
			header.style.borderTopRightRadius = "0";
		} else {
			header.style.borderTopLeftRadius = "24px";
			header.style.borderTopRightRadius = "24px";
		}
	});

	searchInput.addEventListener("input", (e) => {
		const searchTerm = e.target.value.toLowerCase().trim();

		if (searchTerm !== "") {
			clearSearch.style.display = "flex";
			const filteredPokemons = allPokemons.filter((pokemon) => {
				if (!pokemon) return false;
				return pokemon.name.toLowerCase().includes(searchTerm);
			});

			pokemonGrid.innerHTML = "";
			if (filteredPokemons.length === 0) {
				pokemonGrid.innerHTML = `
                    <div class="no-results">
                        <p>Nenhum Pokémon encontrado para "${e.target.value}"</p>
                    </div>
                `;
			} else {
				renderPokemonGrid(filteredPokemons);
			}
		} else {
			clearSearch.style.display = "none";
			renderPokemonGrid(allPokemons);
		}
	});

	clearSearch.addEventListener("click", () => {
		searchInput.value = "";
		clearSearch.style.display = "none";
		renderPokemonGrid(allPokemons);
	});

	fetchPokemons();
});
