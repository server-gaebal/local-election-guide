import type { Residence } from "./electionTypes";
import type {
  NecElectionAreaCache,
  NecElectionDistrictsCache,
  NecSelectboxItem,
  NecTownDistrictScope,
} from "./necElectionInfo";

type TownScopes = {
  town: NecSelectboxItem;
  cityCouncilDistricts: NecSelectboxItem[];
  localCouncilDistricts: NecSelectboxItem[];
};

export function buildNationalResidences(cache: NecElectionDistrictsCache, areaCache?: NecElectionAreaCache): Residence[] {
  return cache.cities.flatMap((city) => {
    const areaResidences = areaCache ? buildAreaResidences(cache, areaCache, city) : [];

    if (areaResidences.length > 0) {
      return areaResidences;
    }

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

type NeighborhoodScope = {
  city: NecSelectboxItem;
  town: NecSelectboxItem;
  districtHeadDistrict?: NecSelectboxItem;
  cityCouncilDistrict?: NecSelectboxItem;
  localCouncilDistrict?: NecSelectboxItem;
  neighborhood: string;
  generatedAt: string;
};

function buildAreaResidences(
  cache: NecElectionDistrictsCache,
  areaCache: NecElectionAreaCache,
  city: NecSelectboxItem,
) {
  const cityRows = areaCache.rows.filter((row) => row.cityCode === city.code);

  if (cityRows.length === 0) {
    return [];
  }

  const scopes = new Map<string, NeighborhoodScope>();

  for (const row of cityRows) {
    for (const neighborhood of row.neighborhoods) {
      const town = findTown(cache, city.code, row.jurisdictionName);

      if (!town) {
        continue;
      }

      const key = `${town.code}:${neighborhood}`;
      const existing =
        scopes.get(key) ??
        ({
          city,
          town,
          districtHeadDistrict: findDistrictHeadDistrict(
            cache.cities.find((item) => item.code === city.code)?.districtHeadScopes ?? [],
            town,
          ),
          neighborhood,
          generatedAt: areaCache.generatedAt,
        } satisfies NeighborhoodScope);

      if (row.electionCode === "4") {
        existing.districtHeadDistrict = { code: row.districtName, name: row.districtName };
      } else if (row.electionCode === "5") {
        existing.cityCouncilDistrict = findTownDistrict(cache, city.code, town.code, "cityCouncil", row.districtName) ?? {
          code: row.districtName,
          name: row.districtName,
        };
      } else if (row.electionCode === "6") {
        existing.localCouncilDistrict = findTownDistrict(cache, city.code, town.code, "localCouncil", row.districtName) ?? {
          code: row.districtName,
          name: row.districtName,
        };
      }

      scopes.set(key, existing);
    }
  }

  return Array.from(scopes.values())
    .filter((scope) => scope.cityCouncilDistrict || scope.localCouncilDistrict)
    .sort((a, b) => a.town.name.localeCompare(b.town.name) || a.neighborhood.localeCompare(b.neighborhood))
    .map(buildNeighborhoodResidence);
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

function buildNeighborhoodResidence(scope: NeighborhoodScope): Residence {
  const districtName = buildDisplayDistrictName(scope.town.name, scope.districtHeadDistrict?.name);

  return {
    id: `nec-${scope.city.code}-${scope.town.code}-dong-${hashText(scope.neighborhood)}`,
    city: scope.city.name,
    district: districtName,
    neighborhood: scope.neighborhood,
    cacheKey: `nec:area:${scope.city.code}:${scope.town.code}:${scope.neighborhood}:v1`,
    cachedAt: scope.generatedAt,
    electionScope: {
      districtHeadDistrict: scope.districtHeadDistrict?.name,
      cityCouncilDistrict: scope.cityCouncilDistrict?.name,
      localCouncilDistrict: scope.localCouncilDistrict?.name,
    },
  };
}

function buildDisplayDistrictName(townName: string, districtHeadName?: string) {
  if (!districtHeadName || townName === districtHeadName) {
    return districtHeadName ?? townName;
  }

  if (townName.startsWith(districtHeadName)) {
    const suffix = townName.slice(districtHeadName.length);
    return [districtHeadName, suffix].filter(Boolean).join(" ");
  }

  return townName;
}

function findTown(cache: NecElectionDistrictsCache, cityCode: string, jurisdictionName: string) {
  const city = cache.cities.find((item) => item.code === cityCode);
  const townScopes = city ? buildTownScopes(city.cityCouncilTownScopes, city.localCouncilTownScopes) : [];

  return townScopes.find((scope) => scope.town.name === jurisdictionName)?.town;
}

function findTownDistrict(
  cache: NecElectionDistrictsCache,
  cityCode: string,
  townCode: string,
  scopeType: "cityCouncil" | "localCouncil",
  districtName: string,
) {
  const city = cache.cities.find((item) => item.code === cityCode);
  const townScopes = scopeType === "cityCouncil" ? city?.cityCouncilTownScopes : city?.localCouncilTownScopes;
  const townScope = townScopes?.find((scope) => scope.town.code === townCode);

  return townScope?.districts.find((district) => district.name === districtName);
}

function findDistrictHeadDistrict(districtHeadScopes: NecSelectboxItem[], town: NecSelectboxItem) {
  return [...districtHeadScopes]
    .sort((a, b) => b.name.length - a.name.length)
    .find((scope) => town.name === scope.name || town.name.startsWith(scope.name));
}

function hashText(value: string) {
  let hash = 0x811c9dc5;

  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(36);
}
