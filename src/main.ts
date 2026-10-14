import "leaflet/dist/leaflet.css";
import "./style.css";
import * as L from "leaflet";
import { getCategoryCities } from "./functions";
import type { City, Category } from "./functions";
import dataset from "./data/world-cities.json";

const question = document.querySelector<HTMLParagraphElement>("#question");
const result = document.querySelector<HTMLParagraphElement>("#result");
const progress = document.querySelector<HTMLParagraphElement>("#progress");
const restartButton = document.querySelector<HTMLButtonElement>("#restart");

const filterForm = document.querySelector<HTMLFormElement>("#filters");
const capitalsInput =
  document.querySelector<HTMLInputElement>("#capitals-only");
const countryInput =
  document.querySelector<HTMLInputElement>("#country-filter");
const countryOptions =
  document.querySelector<HTMLDataListElement>("#country-options");
const continentInput =
  document.querySelector<HTMLSelectElement>("#continent-filter");
const filterMessage =
  document.querySelector<HTMLParagraphElement>("#filter-message");
const difficultyButtons =
  document.querySelectorAll<HTMLButtonElement>("[data-difficulty]");

let cities: City[] = [];
let cityIndex = 0;
let answered = false;
let totalDistanceKm = 0;

const selectedDifficulties = new Set<number>([1, 2, 3, 4, 5]);

const countries = [...dataset.countries].sort((a, b) =>
  a.country.localeCompare(b.country),
);

const map = L.map("map").setView([20, 0], 2);
map.doubleClickZoom.disable();

L.tileLayer(
  `https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png?key=${import.meta.env.VITE_CARTO_API_KEY}`,
  {
    subdomains: "abcd",
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attribution/">CARTO</a>',
  },
).addTo(map);

const answerMarkers = L.layerGroup().addTo(map);

function updateProgress(): void {
  if (!progress) return;

  const current = Math.min(cityIndex + 1, cities.length);
  progress.textContent = `City ${current} of ${cities.length}`;
}

function startQuiz(): void {
  if (!question || !result) return;

  cityIndex = 0;
  answered = false;
  totalDistanceKm = 0;

  answerMarkers.clearLayers();
  result.textContent = "";

  updateProgress();
  map.setView([20, 0], 2);

  const firstCity = cities[0];

  if (!firstCity) {
    question.textContent = "No cities available.";
    answered = true;
    return;
  }

  question.textContent = `Double-click ${firstCity.name} on the map.`;
}

function advanceCity(): void {
  if (!question || !result) return;

  cityIndex += 1;
  updateProgress();

  const city = cities[cityIndex];

  if (!city) {
    answered = true;
    question.textContent = "Quiz complete!";

    const average = totalDistanceKm / cities.length;
    result.textContent += ` Average distance: ${Math.round(average)} km.`;

    return;
  }

  answered = false;
  question.textContent = `Double-click ${city.name} on the map.`;
}

function selectCategory(category: Category = {}): void {
  cities = getCategoryCities(category);
  startQuiz();
}

if (countryOptions) {
  for (const country of countries) {
    const option = document.createElement("option");
    option.value = country.country;
    countryOptions.append(option);
  }
}

map.on("dblclick", (event: L.LeafletMouseEvent) => {
  if (!result || answered) return;

  const city = cities[cityIndex];
  if (!city) return;

  answered = true;

  const target = L.latLng(city.latitude, city.longitude);

  L.circleMarker(target, {
    radius: 3,
    color: "red",
    fillColor: "red",
    fillOpacity: 1,
  })
    .addTo(answerMarkers)
    .bindTooltip(city.name, {
      permanent: true,
      direction: "top",
    });

  const distanceKm = event.latlng.distanceTo(target) / 1000;
  totalDistanceKm += distanceKm;

  result.textContent = `You were ${Math.round(distanceKm)} km from ${city.name}.`;

  advanceCity();
});

restartButton?.addEventListener("click", () => {
  startQuiz();
});

difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const difficulty = Number(button.dataset.difficulty);

    if (selectedDifficulties.has(difficulty)) {
      selectedDifficulties.delete(difficulty);
    } else {
      selectedDifficulties.add(difficulty);
    }

    button.setAttribute(
      "aria-pressed",
      String(selectedDifficulties.has(difficulty)),
    );
  });
});

filterForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!capitalsInput || !countryInput || !continentInput || !filterMessage) {
    return;
  }

  const countryName = countryInput.value.trim();

  const country = countries.find(
    (item) => item.country.toLowerCase() === countryName.toLowerCase(),
  );

  if (countryName && !country) {
    filterMessage.textContent = "Choose a country from the suggestions.";
    return;
  }

  if (selectedDifficulties.size === 0) {
    filterMessage.textContent = "Select at least one difficulty.";
    return;
  }

  const filteredCities = getCategoryCities({
    countryCode: country?.countryCode,
    continent: continentInput.value || undefined,
    capitalsOnly: capitalsInput.checked,
    difficulties: [...selectedDifficulties],
  });

  if (filteredCities.length === 0) {
    filterMessage.textContent = "No cities match those filters.";
    return;
  }

  cities = filteredCities;
  startQuiz();

  filterMessage.textContent = `${cities.length} cities selected.`;
});

selectCategory();
