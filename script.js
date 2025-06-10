document.addEventListener("DOMContentLoaded", () => {
	const pokemonGrid = document.getElementById("pokemonGrid");
	const header = document.querySelector(".main-header");
	const searchInput = document.getElementById("searchInput");
	const clearSearch = document.getElementById("clearSearch");
	const modalBody = document.querySelector(".modal-body");
	const modal = document.getElementById("pokemonModal");
	const closeButton = document.querySelector(".close-button");
	const loadingOverlay = document.getElementById("loadingOverlay");

	const themeToggle = document.getElementById("themeToggle");
	const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

	const dropdown = document.querySelector(".dropdown-language");
	const dropdownToggle = document.getElementById("selectedLang");
	const dropdownItems = document.querySelectorAll(".dropdown-item");

	let allPokemons = [];
	let currentLang = "en";

	const translations = {
		es: {
			search: "Buscar Pokémon...",
			height: "Altura",
			weight: "Peso",
			types: "Tipos",
			abilities: "Habilidades",
			category: "Categoria",
			stats: {
				hp: "HP",
				attack: "Ataque",
				defense: "Defensa",
				speed: "Velocidad",
			},
		},
		en: {
			search: "Search Pokémon...",
			height: "Height",
			weight: "Weight",
			types: "Types",
			abilities: "Abilities",
			category: "Category",
			stats: {
				hp: "HP",
				attack: "Attack",
				defense: "Defense",
				speed: "Speed",
			},
		},
	};

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

			const [pokemonRes, speciesRes] = await Promise.all([
				fetch(url),
				fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`),
			]);

			if (!pokemonRes.ok || !speciesRes.ok) {
				console.error("Erro ao buscar dados da API para o Pokémon ID: ", id);
				return null;
			}

			const pokemon = await pokemonRes.json();
			const species = await speciesRes.json();

			const nameObj = species.names.find(
				(specie) => specie.language.name === currentLang,
			);
			const translatedName = nameObj ? nameObj.name : pokemon.name;

			const flavorObj = species.flavor_text_entries.find(
				(f) => f.language.name === currentLang,
			);

			const description = flavorObj
				? flavorObj.flavor_text.replace(/\f|\n/g, " ")
				: "";

			const genusObj = species.genera.find(
				(g) => g.language.name === currentLang,
			);
			const category = genusObj ? genusObj.genus : "";

			const types = await Promise.all(
				pokemon.types.map(async (type) => {
					const typeRes = await fetch(type.type.url);
					const typeData = await typeRes.json();
					const typeNameObj = typeData.names.find(
						(type) => type.language.name === currentLang,
					);

					return {
						name: typeNameObj ? typeNameObj.name : typeData.name,
						color: getTypeColors(type.type.name),
					};
				}),
			);

			const abilities = await Promise.all(
				pokemon.abilities.map(async (ability) => {
					const abilityRes = await fetch(ability.ability.url);
					const abilityData = await abilityRes.json();
					const abilityNameObj = abilityData.names.find(
						(ability) => ability.language.name === currentLang,
					);
					return abilityNameObj ? abilityNameObj.name : abilityData.name;
				}),
			);

			return {
				id,
				...pokemon,
				translatedName,
				description,
				category,
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
		modalBody.innerHTML = `
            <img src="${getPokemonImage(pokemon)}" alt="${pokemon.translatedName || pokemon.name}">
            <h2>${pokemon.translatedName || pokemon.name}</h2>
            <div class="pokemon-details">
                <div class="detail-item">
                    <strong>${translations[currentLang].height}</strong>
                    ${(pokemon.height / 10).toFixed(1)}m
                </div>
                <div class="detail-item">
                    <strong>${translations[currentLang].weight}</strong>
                    ${(pokemon.weight / 10).toFixed(1)}kg
                </div>
                <div class="detail-item">
                    <strong>${translations[currentLang].types}</strong>
                    ${pokemon.types.map((type) => type.name).join(", ")}
                </div>
                <div class="detail-item">
                    <strong>${translations[currentLang].abilities}</strong>
                    ${pokemon.abilities.join(", ")}
                </div>
                <div class="detail-item">
                    <strong>${translations[currentLang].stats.hp}</strong>
                    ${pokemon.stats[0].base_stat}
                </div>
                <div class="detail-item">
                    <strong>${translations[currentLang].stats.attack}</strong>
                    ${pokemon.stats[1].base_stat}
                </div>
                <div class="detail-item">
                    <strong>${translations[currentLang].stats.defense}</strong>
                    ${pokemon.stats[2].base_stat}
                </div>
                <div class="detail-item">
                    <strong>${translations[currentLang].stats.speed}</strong>
                    ${pokemon.stats[5].base_stat}
                </div>
            </div>
            ${pokemon.description ? `<p>${pokemon.description}</p>` : ""}
            ${pokemon.category ? `<p>${translations[currentLang].category}: ${pokemon.category}</p>` : ""}
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
		img.alt = pokemon.translatedName || pokemon.name;
		img.src = getPokemonImage(pokemon);

		const title = document.createElement("h3");
		title.textContent = pokemon.translatedName || pokemon.name;

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
				const pokemonName = (
					pokemon.translatedName || pokemon.name
				).toLowerCase();

				return pokemonName.includes(searchTerm);
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

	closeButton.addEventListener("click", () => {
		modal.classList.remove("active");
		setTimeout(() => {
			modal.style.display = "none";
		}, 10);
	});

	modal.addEventListener("click", (e) => {
		if (e.target === modal) {
			modal.classList.remove("active");
			setTimeout(() => {
				modal.style.display = "none";
			}, 10);
		}
	});

	document.documentElement.setAttribute(
		"data-theme",
		localStorage.getItem("theme") ||
			(prefersDarkScheme.matches ? "dark" : "light"),
	);

	themeToggle.addEventListener("click", () => {
		const currentTheme = document.documentElement.getAttribute("data-theme");
		const newTheme = currentTheme === "light" ? "dark" : "light";

		document.documentElement.setAttribute("data-theme", newTheme);
		localStorage.setItem("theme", newTheme);
	});

	prefersDarkScheme.addEventListener("change", () => {
		if (!localStorage.getItem("theme")) {
			document.documentElement.setAttribute(
				"data-theme",
				prefersDarkScheme.matches ? "dark" : "light",
			);
		}
	});

	document.documentElement.lang = currentLang;

	let activeLangButton = null;

	for (const item of dropdownItems) {
		if (item.dataset.lang === currentLang) {
			activeLangButton = item;
			break;
		}
	}

	if (activeLangButton) {
		activeLangButton.classList.add("active");
		dropdownToggle.innerHTML = activeLangButton.innerHTML;
	}

	dropdownToggle.addEventListener("click", () => {
		dropdown.classList.toggle("open");
	});

	window.addEventListener("click", (e) => {
		if (dropdown.classList.contains("open")) {
			if (!dropdown.contains(e.target)) {
				dropdown.classList.remove("open");
			}
		}
	});

	fetchPokemons();

	for (const button of dropdownItems) {
		button.addEventListener("click", () => {
			const newLang = button.dataset.lang;
			if (newLang === currentLang) return;

			currentLang = newLang;
			searchInput.placeholder = translations[currentLang].search;

			for (const item of dropdownItems) {
				item.classList.remove("active");
			}
			button.classList.add("active");
			dropdownToggle.innerHTML = button.innerHTML;
			dropdown.classList.remove("open");

			fetchPokemons();

			for (pokemon of allPokemons) {
				const card = pokemonGrid.querySelector(
					`.pokemon-card[data-id="${pokemon.id}"]`,
				);

				if (card) {
					card.querySelector("img").alt =
						pokemon.translatedName || pokemon.name;
					card.querySelector("h3").textContent =
						pokemon.translatedName || pokemon.name;

					const typesDiv = card.querySelector(".pokemon-types");

					typesDiv.innerHTML = pokemon.types
						.map(
							(type) => `
                        <span class="type-badge" style="background-color: ${type.color}">
                            ${type.name}
                        </span>    
                    `,
						)
						.join("");
				}
			}
		});
	}
});
