import dataset from "./data/world-cities.json";

export type City = (typeof dataset.cities)[number];

export type Category = {
  continent?: string;
  countryCode?: string;
  difficulty?: number;
  difficulties?: number[];
  capitalsOnly?: boolean;
  maxRank?: number;
};

export function getCategoryCities(category: Category = {}): City[] {
  const selected = dataset.cities.filter(
    (city) =>
      (category.continent === undefined ||
        city.continent === category.continent) &&
      (category.countryCode === undefined ||
        city.countryCode === category.countryCode) &&
      (category.difficulty === undefined ||
        city.difficulty === category.difficulty) &&
      (category.difficulties === undefined ||
        category.difficulties.includes(city.difficulty)) &&
      (!category.capitalsOnly || city.isCapital) &&
      (category.maxRank === undefined ||
        city.populationRank <= category.maxRank),
  );

  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    const current = selected[i]!;
    selected[i] = selected[j]!;
    selected[j] = current;
  }

  return selected;
}
