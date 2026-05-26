import type { Residence } from "./electionTypes";
import type { NecElectionDistrictsCache, NecSelectboxItem, NecTownDistrictScope } from "./necElectionInfo";

type TownScopes = {
  town: NecSelectboxItem;
  cityCouncilDistricts: NecSelectboxItem[];
  localCouncilDistricts: NecSelectboxItem[];
};

export function buildNationalResidences(cache: NecElectionDistrictsCache): Residence[] {
  return cache.cities.flatMap((city) => {
    const townScopes = buildTownScopes(city.cityCouncilTownScopes, city.localCouncilTownScopes);

    return townScopes.flatMap((townScope) => {
      const cityCouncilDistricts = townScope.cityCouncilDistricts.length > 0 ? townScope.cityCouncilDistricts : [undefined];
      const localCouncilDistricts = townScope.localCouncilDistricts.length > 0 ? townScope.localCouncilDistricts : [undefined];

      return cityCouncilDistricts.flatMap((cityCouncilDistrict) =>
        localCouncilDistricts.map((localCouncilDistrict) =>
          buildResidence({
            city,
            town: townScope.town,
            districtHeadDistrict: findDistrictHeadDistrict(city.districtHeadScopes, townScope.town),
            cityCouncilDistrict,
            localCouncilDistrict,
            generatedAt: cache.generatedAt,
          }),
        ),
      );
    });
  });
}

function buildTownScopes(
  cityCouncilTownScopes: NecTownDistrictScope[],
  localCouncilTownScopes: NecTownDistrictScope[],
) {
  const towns = new Map<string, TownScopes>();

  for (const scope of cityCouncilTownScopes) {
    towns.set(scope.town.code, {
      town: scope.town,
      cityCouncilDistricts: scope.districts,
      localCouncilDistricts: [],
    });
  }

  for (const scope of localCouncilTownScopes) {
    const existing = towns.get(scope.town.code);

    if (existing) {
      existing.localCouncilDistricts = scope.districts;
      continue;
    }

    towns.set(scope.town.code, {
      town: scope.town,
      cityCouncilDistricts: [],
      localCouncilDistricts: scope.districts,
    });
  }

  return Array.from(towns.values());
}

function buildResidence({
  city,
  town,
  districtHeadDistrict,
  cityCouncilDistrict,
  localCouncilDistrict,
  generatedAt,
}: {
  city: NecSelectboxItem;
  town: NecSelectboxItem;
  districtHeadDistrict?: NecSelectboxItem;
  cityCouncilDistrict?: NecSelectboxItem;
  localCouncilDistrict?: NecSelectboxItem;
  generatedAt: string;
}): Residence {
  const cityCouncilCode = cityCouncilDistrict?.code ?? "metro";
  const localCouncilCode = localCouncilDistrict?.code ?? "local";
  const scopeLabel = [cityCouncilDistrict?.name, localCouncilDistrict?.name].filter(Boolean).join(" · ") || town.name;
  const districtName = districtHeadDistrict?.name ?? town.name;
  const townPrefix = districtHeadDistrict ? town.name.replace(districtHeadDistrict.name, "").trim() : "";
  const neighborhood = [townPrefix, scopeLabel].filter(Boolean).join(" ");

  return {
    id: `nec-${city.code}-${town.code}-${cityCouncilCode}-${localCouncilCode}`,
    city: city.name,
    district: districtName,
    neighborhood,
    cacheKey: `nec:scope:${city.code}:${town.code}:${cityCouncilCode}:${localCouncilCode}:v1`,
    cachedAt: generatedAt,
    electionScope: {
      districtHeadDistrict: districtHeadDistrict?.name,
      cityCouncilDistrict: cityCouncilDistrict?.name,
      localCouncilDistrict: localCouncilDistrict?.name,
    },
  };
}

function findDistrictHeadDistrict(districtHeadScopes: NecSelectboxItem[], town: NecSelectboxItem) {
  return [...districtHeadScopes]
    .sort((a, b) => b.name.length - a.name.length)
    .find((scope) => town.name === scope.name || town.name.startsWith(scope.name));
}
