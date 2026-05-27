import {
  ChevronRight,
  CircleAlert,
  Check,
  ExternalLink,
  FileText,
  Filter,
  Landmark,
  MapPin,
  Scale,
  Search,
  Share2,
  ShieldCheck,
  UserRound,
  Vote,
  X,
  ZoomIn,
} from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  loadCacheManifest,
  loadRegionDataset,
  loadRegionIndex,
  type CacheManifest,
  type RegionDataset,
  type RegionIndex,
} from "./dataLoader";
import {
  type Candidate,
  type RaceType,
  type Residence,
  type VoterProfile,
} from "./electionTypes";
import { getCandidateFactCheck } from "./factChecks";
import {
  getCandidatePersonaReviewForCandidate,
  getCandidatePersonaSourcePledges,
  personaReviewScopeNotice,
} from "./personaReviews";
import {
  createResidenceShareDescription,
  createResidenceShareTitle,
  createResidenceShareUrl,
} from "./sharePreview";

const allRaces = "전체";
type BallotFilter = typeof allRaces | string;

type BallotGroup = {
  id: string;
  title: string;
  race: RaceType;
  order: number;
  candidates: Candidate[];
};

const raceOrder: Record<RaceType, number> = {
  광역단체장: 10,
  교육감: 20,
  기초단체장: 30,
  광역의원: 40,
  기초의원: 50,
};

const preferredInitialResidenceId = "seoul-mapo-gongdeok";
const necRelatedLinks = [
  {
    name: "정책공약마당",
    url: "https://policy.nec.go.kr/plc/commiment/initUCACommiment.do?menuId=CNDDT25",
  },
  {
    name: "후보자 정보공개",
    url: "https://info.nec.go.kr/main/showDocument.xhtml?electionId=0020260603&topMenuId=CP&secondMenuId=CPRI03",
  },
] as const;
const preferredInitialResidenceLocation = {
  city: "서울특별시",
  district: "마포구",
  neighborhood: "공덕동",
};
const citySortOrder = [
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원특별자치도",
  "강원도",
  "충청북도",
  "충청남도",
  "전북특별자치도",
  "전라북도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
];
const citySortRank = new Map(citySortOrder.map((cityName, index) => [cityName, index]));
const koCollator = new Intl.Collator("ko-KR", { numeric: true, sensitivity: "base" });

type ResidenceOption = {
  residence: Residence;
  label: string;
  normalizedLabel: string;
};

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function getCandidateToneIcon(candidate: Candidate) {
  if (candidate.criminalRecord.tone === "clean") {
    return <ShieldCheck aria-hidden="true" size={16} />;
  }

  return <CircleAlert aria-hidden="true" size={16} />;
}

function compareKoreanText(a: string, b: string) {
  return koCollator.compare(a, b);
}

function compareCityNames(a: string, b: string) {
  const rankA = citySortRank.get(a) ?? Number.POSITIVE_INFINITY;
  const rankB = citySortRank.get(b) ?? Number.POSITIVE_INFINITY;

  return rankA - rankB || compareKoreanText(a, b);
}

function compareResidences(a: Residence, b: Residence) {
  return (
    compareCityNames(a.city, b.city) ||
    compareKoreanText(a.district, b.district) ||
    compareKoreanText(a.neighborhood, b.neighborhood) ||
    compareKoreanText(a.id, b.id)
  );
}

function sortResidences(residences: Residence[]) {
  return [...residences].sort(compareResidences);
}

function sortKoreanValues(values: string[]) {
  return [...values].sort(compareKoreanText);
}

function getSelectableResidences(regionIndex: RegionIndex, manifest: CacheManifest) {
  const availableRegionIds = new Set(manifest.regions.map((region) => region.id));
  const availableResidences = regionIndex.residences.filter((residence) => availableRegionIds.has(residence.id));

  return sortResidences(availableResidences.length > 0 ? availableResidences : regionIndex.residences);
}

function formatResidenceLabel(residence: Residence) {
  return `${residence.city} ${residence.district} ${residence.neighborhood}`;
}

function normalizeResidenceSearch(value: string) {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase("ko-KR");
}

function createResidenceOption(residence: Residence): ResidenceOption {
  const label = formatResidenceLabel(residence);

  return {
    residence,
    label,
    normalizedLabel: normalizeResidenceSearch(label),
  };
}

function getResidenceSearchMatches(options: ResidenceOption[], query: string) {
  const tokens = normalizeResidenceSearch(query).split(" ").filter(Boolean);

  if (tokens.length === 0) {
    return [];
  }

  return options.filter((option) => tokens.every((token) => option.normalizedLabel.includes(token))).slice(0, 30);
}

function findInitialResidence(residences: Residence[]): Residence | null {
  return (
    residences.find((residence) => residence.id === preferredInitialResidenceId) ??
    residences.find(
      (residence) =>
        residence.city === preferredInitialResidenceLocation.city &&
        residence.district === preferredInitialResidenceLocation.district &&
        residence.neighborhood === preferredInitialResidenceLocation.neighborhood,
    ) ??
    residences[0] ??
    null
  );
}

function findResidenceFromUrl(residences: Residence[]) {
  if (typeof window === "undefined") {
    return null;
  }

  const residenceId = new URLSearchParams(window.location.search).get("region");

  if (!residenceId) {
    return null;
  }

  return residences.find((residence) => residence.id === residenceId) ?? null;
}

function replaceResidenceInUrl(residenceId: string) {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set("region", residenceId);
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

function getBallotId(candidate: Candidate) {
  return `${candidate.residenceId}:${candidate.office}`;
}

function getBallotTitle(candidate: Candidate) {
  return `${candidate.office} 후보`;
}

function getBallotSortOrder(candidate: Candidate) {
  const proportionalOffset = candidate.office.includes("비례대표") ? 1 : 0;

  return raceOrder[candidate.race] * 10 + proportionalOffset;
}

function createBallotGroups(candidateList: Candidate[]): BallotGroup[] {
  const groups = new Map<string, BallotGroup>();

  for (const candidate of candidateList) {
    const id = getBallotId(candidate);
    const existing = groups.get(id);

    if (existing) {
      existing.candidates.push(candidate);
      continue;
    }

    groups.set(id, {
      id,
      title: getBallotTitle(candidate),
      race: candidate.race,
      order: getBallotSortOrder(candidate),
      candidates: [candidate],
    });
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      candidates: group.candidates.sort((a, b) => a.number - b.number || a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function App() {
  const [manifest, setManifest] = useState<CacheManifest | null>(null);
  const [regionIndex, setRegionIndex] = useState<RegionIndex | null>(null);
  const [regionDataset, setRegionDataset] = useState<RegionDataset | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [regionSearch, setRegionSearch] = useState("");
  const [profile, setProfile] = useState<VoterProfile>("청년");
  const [largeText, setLargeText] = useState(false);
  const [ballotFilter, setBallotFilter] = useState<BallotFilter>(allRaces);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [shareStatus, setShareStatus] = useState<"idle" | "done">("idle");

  useEffect(() => {
    let isActive = true;

    Promise.all([loadCacheManifest(), loadRegionIndex()])
      .then(([nextManifest, nextRegionIndex]) => {
        if (!isActive) {
          return;
        }

        const nextResidences = getSelectableResidences(nextRegionIndex, nextManifest);
        const nextResidence = findResidenceFromUrl(nextResidences) ?? findInitialResidence(nextResidences);
        setManifest(nextManifest);
        setRegionIndex(nextRegionIndex);

        if (nextResidence) {
          setCity(nextResidence.city);
          setDistrict(nextResidence.district);
          setNeighborhood(nextResidence.neighborhood);
        }
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setLoadError(error instanceof Error ? error.message : "정적 데이터를 불러오지 못했습니다.");
      });

    return () => {
      isActive = false;
    };
  }, []);

  const residences = useMemo(
    () => (regionIndex && manifest ? getSelectableResidences(regionIndex, manifest) : []),
    [manifest, regionIndex],
  );
  const voterProfiles = regionIndex?.voterProfiles ?? [];
  const initialResidence = findInitialResidence(residences);

  const cities = useMemo(() => unique(residences.map((residence) => residence.city)), [residences]);
  const districts = useMemo(
    () =>
      sortKoreanValues(
        unique(residences.filter((residence) => residence.city === city).map((residence) => residence.district)),
      ),
    [city, residences],
  );
  const neighborhoods = useMemo(
    () =>
      sortKoreanValues(
        unique(
          residences
            .filter((residence) => residence.city === city && residence.district === district)
            .map((residence) => residence.neighborhood),
        ),
      ),
    [city, district, residences],
  );
  const residenceOptions = useMemo(() => residences.map(createResidenceOption), [residences]);
  const regionSearchMatches = useMemo(
    () => getResidenceSearchMatches(residenceOptions, regionSearch),
    [residenceOptions, regionSearch],
  );
  const regionSearchOptions = regionSearch.trim() ? regionSearchMatches : residenceOptions.slice(0, 20);

  const selectedResidence =
    residences.find(
      (residence) =>
        residence.city === city &&
        residence.district === district &&
        residence.neighborhood === neighborhood,
    ) ?? initialResidence;

  useEffect(() => {
    if (!selectedResidence) {
      return;
    }

    let isActive = true;
    setRegionDataset(null);

    loadRegionDataset(selectedResidence.id)
      .then((nextRegionDataset) => {
        if (isActive) {
          setRegionDataset(nextRegionDataset);
        }
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setLoadError(error instanceof Error ? error.message : "지역 후보 데이터를 불러오지 못했습니다.");
      });

    return () => {
      isActive = false;
    };
  }, [selectedResidence?.id]);

  const regionalCandidates = useMemo(
    () =>
      regionDataset && selectedResidence && regionDataset.residence.id === selectedResidence.id
        ? regionDataset.candidates
        : [],
    [regionDataset, selectedResidence?.id],
  );

  const allBallotGroups = useMemo(() => createBallotGroups(regionalCandidates), [regionalCandidates]);
  const ballotGroups = allBallotGroups;

  const ballotOptions = useMemo(
    () => [allRaces, ...ballotGroups.map((group) => group.id)],
    [ballotGroups],
  );

  const visibleBallotGroups = useMemo(
    () => ballotGroups.filter((group) => ballotFilter === allRaces || group.id === ballotFilter),
    [ballotFilter, ballotGroups],
  );

  useEffect(() => {
    if (ballotFilter !== allRaces && !ballotGroups.some((group) => group.id === ballotFilter)) {
      setBallotFilter(allRaces);
    }
  }, [ballotFilter, ballotGroups]);

  const totalCandidateCount = useMemo(
    () => ballotGroups.reduce((sum, group) => sum + group.candidates.length, 0),
    [ballotGroups],
  );

  const selectResidence = (nextResidence: Residence, options?: { searchLabel?: string }) => {
    setCity(nextResidence.city);
    setDistrict(nextResidence.district);
    setNeighborhood(nextResidence.neighborhood);
    replaceResidenceInUrl(nextResidence.id);
    setBallotFilter(allRaces);
    setSelectedCandidate(null);
    setShareStatus("idle");
    setRegionSearch(options?.searchLabel ?? "");
  };

  const handleCityChange = (nextCity: string) => {
    const nextResidence = residences.find((residence) => residence.city === nextCity) ?? initialResidence;
    if (!nextResidence) {
      return;
    }

    selectResidence(nextResidence);
  };

  const handleDistrictChange = (nextDistrict: string) => {
    const nextResidence =
      residences.find((residence) => residence.city === city && residence.district === nextDistrict) ??
      initialResidence;

    if (!nextResidence) {
      return;
    }

    selectResidence(nextResidence);
  };

  const handleNeighborhoodChange = (nextNeighborhood: string) => {
    const nextResidence = residences.find(
      (residence) =>
        residence.city === city &&
        residence.district === district &&
        residence.neighborhood === nextNeighborhood,
    );

    if (nextResidence) {
      selectResidence(nextResidence);
    }
  };

  const commitRegionSearch = () => {
    const normalizedQuery = normalizeResidenceSearch(regionSearch);
    const exactMatch = residenceOptions.find((option) => option.normalizedLabel === normalizedQuery);
    const match = exactMatch ?? regionSearchMatches[0];

    if (match) {
      selectResidence(match.residence, { searchLabel: match.label });
    }
  };

  const handleRegionSearchChange = (nextSearch: string) => {
    setRegionSearch(nextSearch);

    const normalizedSearch = normalizeResidenceSearch(nextSearch);
    const exactMatch = residenceOptions.find((option) => option.normalizedLabel === normalizedSearch);

    if (exactMatch) {
      selectResidence(exactMatch.residence, { searchLabel: exactMatch.label });
    }
  };

  const handleProfileChange = (nextProfile: VoterProfile) => {
    setProfile(nextProfile);

    if (nextProfile === "고령층") {
      setLargeText(true);
    }
  };

  const handleShareResidence = async () => {
    if (!selectedResidence) {
      return;
    }

    const title = createResidenceShareTitle(selectedResidence);
    const text = createResidenceShareDescription(selectedResidence, ballotGroups.length, totalCandidateCount);
    const url = createResidenceShareUrl(selectedResidence.id);

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, text, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }

      setShareStatus("done");
      window.setTimeout(() => setShareStatus("idle"), 1800);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setLoadError("공유 링크를 준비하지 못했습니다. 브라우저 권한을 확인해 주세요.");
    }
  };

  if (loadError) {
    return (
      <main className="app-shell">
        <section className="load-state" role="alert">
          <h1>데이터를 불러오지 못했습니다</h1>
          <p>{loadError}</p>
        </section>
      </main>
    );
  }

  if (!manifest || !regionIndex || !selectedResidence) {
    return (
      <main className="app-shell">
        <section className="load-state">
          <h1>지방선거 가이드</h1>
          <p>정적 JSON 캐시를 불러오는 중입니다.</p>
        </section>
      </main>
    );
  }

  return (
    <main className={largeText ? "app-shell app-shell--large-text" : "app-shell"}>
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            <Vote size={24} />
          </span>
          <div>
            <p className="eyebrow">{getDataModeLabel(manifest.dataMode)}</p>
            <h1>지방선거 가이드</h1>
          </div>
        </div>
        <button type="button" className="share-button" aria-label="선택 지역 공유" onClick={handleShareResidence}>
          {shareStatus === "done" ? <Check aria-hidden="true" size={17} /> : <Share2 aria-hidden="true" size={17} />}
          <span>{shareStatus === "done" ? "링크 준비됨" : "공유"}</span>
        </button>
      </header>

      <section className="selector-band" aria-label="유권자 조건">
        <div className="selector-grid">
          <label className="field">
            <span>시도</span>
            <select value={city} onChange={(event) => handleCityChange(event.target.value)}>
              {cities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>시군구</span>
            <select value={district} onChange={(event) => handleDistrictChange(event.target.value)}>
              {districts.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>읍면동</span>
            <select value={neighborhood} onChange={(event) => handleNeighborhoodChange(event.target.value)}>
              {neighborhoods.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="field region-search-field">
            <span>지역 검색</span>
            <div className="region-search-control">
              <input
                role="searchbox"
                type="search"
                value={regionSearch}
                list="region-search-options"
                placeholder="시군구·읍면동"
                aria-label="지역 검색"
                onChange={(event) => handleRegionSearchChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitRegionSearch();
                  }
                }}
              />
              <button type="button" aria-label="지역 검색 적용" onClick={commitRegionSearch}>
                <Search aria-hidden="true" size={17} />
              </button>
            </div>
            <datalist id="region-search-options">
              {regionSearchOptions.map((option) => (
                <option key={option.residence.id} value={option.label} />
              ))}
            </datalist>
          </label>

          <div className="profile-switch" aria-label="유권자 프로필">
            <div className="profile-switch__label">
              <UserRound aria-hidden="true" size={16} />
              <span>프로필</span>
            </div>
            <div className="profile-switch__buttons">
              {voterProfiles.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-label={item}
                  className={item === profile ? "is-active" : ""}
                  onClick={() => handleProfileChange(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="text-mode">
            <button
              type="button"
              aria-pressed={largeText}
              className={largeText ? "text-mode__button is-active" : "text-mode__button"}
              onClick={() => setLargeText((enabled) => !enabled)}
            >
              <ZoomIn aria-hidden="true" size={17} />
              <span>큰 글씨</span>
            </button>
          </div>
        </div>
      </section>

      <section className="status-band" aria-label="선택 요약">
        <div className="status-tile">
          <MapPin aria-hidden="true" size={18} />
          <span>선택 주소</span>
          <strong>{`${selectedResidence.city} ${selectedResidence.district} ${selectedResidence.neighborhood}`}</strong>
        </div>
        <div className="status-tile">
          <Vote aria-hidden="true" size={18} />
          <span>표시 투표지</span>
          <strong>{ballotGroups.length}종</strong>
        </div>
        <div className="status-tile">
          <UserRound aria-hidden="true" size={18} />
          <span>표시 후보</span>
          <strong>{totalCandidateCount}명</strong>
        </div>
      </section>

      <section className="workspace">
        <aside className="filter-rail" aria-label="투표지 필터">
          <div className="rail-title">
            <Filter aria-hidden="true" size={16} />
            <span>투표지</span>
          </div>
          <div className="race-list">
            {ballotOptions.map((ballotId) => {
              const group = ballotGroups.find((item) => item.id === ballotId);
              const label = group?.title.replace(/ 후보$/, "") ?? allRaces;

              return (
                <button
                  key={ballotId}
                  type="button"
                  className={ballotId === ballotFilter ? "is-active" : ""}
                  onClick={() => setBallotFilter(ballotId)}
                >
                  <Landmark aria-hidden="true" size={15} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
          <div className="source-box">
            <FileText aria-hidden="true" size={16} />
            <span>{regionDataset?.source.sourceName ?? manifest.sourceName}</span>
          </div>
        </aside>

        <section className="candidate-area" aria-label="후보 목록">
          <div className="section-head">
            <div>
              <p className="eyebrow">{profile} 관점</p>
              <h2>{`${selectedResidence.city} ${selectedResidence.district} ${selectedResidence.neighborhood}에서 공약을 비교할 후보`}</h2>
            </div>
            <div className="result-count">
              <strong>{totalCandidateCount}</strong>
              <span>명</span>
            </div>
          </div>

          {regionDataset && visibleBallotGroups.length > 0 ? (
            <div className="candidate-sections">
              {visibleBallotGroups.map((group) => (
                <section className="ballot-section" key={group.id} aria-labelledby={`${group.id}-title`}>
                  <header className="ballot-section__header">
                    <div>
                      <p>{group.race}</p>
                      <h3 id={`${group.id}-title`}>{group.title}</h3>
                    </div>
                    <span>{group.candidates.length}명</span>
                  </header>
                  <div className="candidate-grid">
                    {group.candidates.map((candidate) => (
                      <CandidateCard
                        key={candidate.id}
                        candidate={candidate}
                        ballotCandidates={group.candidates}
                        profile={profile}
                        onOpen={() => setSelectedCandidate(candidate)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : regionDataset ? (
            <div className="region-empty-state" aria-live="polite">
              <FileText aria-hidden="true" size={18} />
              <strong>표시할 후보 없음</strong>
              <span>이 지역에는 현재 표시할 후보 자료가 없습니다.</span>
            </div>
          ) : (
            <div className="region-loading" aria-live="polite">
              <FileText aria-hidden="true" size={18} />
              <span>후보자 자료 불러오는 중</span>
            </div>
          )}
        </section>

      </section>

      {selectedCandidate ? (
        <CandidateDialog
          candidate={selectedCandidate}
          ballotCandidates={getBallotCandidates(regionDataset?.candidates ?? [], selectedCandidate)}
          profile={profile}
          onClose={() => setSelectedCandidate(null)}
        />
      ) : null}

    </main>
  );
}

function getBallotCandidates(candidates: Candidate[], selectedCandidate: Candidate) {
  return candidates.filter(
    (candidate) =>
      candidate.residenceId === selectedCandidate.residenceId &&
      candidate.race === selectedCandidate.race &&
      candidate.office === selectedCandidate.office,
  );
}

function getVoterComparisonPreview(candidate: Candidate, ballotCandidates: Candidate[]) {
  if (isVoterFacingComparisonText(candidate.comparison) && !isGenericComparisonSummary(candidate.comparison)) {
    return candidate.comparison;
  }

  const policyLeads = getCandidatePolicyLeads(candidate);
  const topics = inferPolicyTopics(policyLeads);
  const primaryLead = policyLeads[0];

  if (topics.length > 0) {
    return `정책 초점은 ${formatTopicList(topics)}입니다.`;
  }

  if (primaryLead) {
    return `대표 공약은 ${primaryLead}입니다.`;
  }

  const otherCandidateCount = Math.max(ballotCandidates.length - 1, 0);

  if (otherCandidateCount > 0) {
    return `${candidate.office} 후보 ${otherCandidateCount}명과 같은 투표지에 있습니다.`;
  }

  return "공개된 후보 기본정보와 공약 원문 여부를 먼저 확인해 보세요.";
}

function getVoterComparisonDetails(candidate: Candidate, ballotCandidates: Candidate[]) {
  const usefulDetails = candidate.comparisonDetails.filter(isVoterFacingComparisonText);

  return usefulDetails.length > 0 ? usefulDetails : buildVoterComparisonDetails(candidate, ballotCandidates);
}

function getVoterComparisonCardDetails(candidate: Candidate, ballotCandidates: Candidate[]) {
  const policyLeads = getCandidatePolicyLeads(candidate);
  const topics = inferPolicyTopics(policyLeads);
  const otherCandidateCount = Math.max(ballotCandidates.length - 1, 0);

  if (topics.length > 0) {
    const leadText = formatPolicyLeadList(policyLeads);
    const topicText = formatTopicList(topics, 3);

    return [
      leadText ? `앞세운 공약: ${leadText}.` : `정책 분야: ${topicText}.`,
      otherCandidateCount > 0
        ? `같은 투표지에서는 ${topicText} 공약을 중심으로 차이가 납니다.`
        : `${topicText} 공약이 이 후보의 주요 차별점입니다.`,
    ];
  }

  if (policyLeads.length > 0) {
    return [`앞세운 공약: ${formatPolicyLeadList(policyLeads)}.`, "차이는 공약 대상과 실행 방식에서 확인됩니다."];
  }

  if (otherCandidateCount > 0) {
    return [`같은 투표지 후보: ${otherCandidateCount}명.`, "차이가 보이는 항목: 정당, 전과, 경력, 재산·납세."];
  }

  return ["요약: 공개된 후보 기본정보부터 확인하세요."];
}

function buildVoterComparisonDetails(candidate: Candidate, ballotCandidates: Candidate[]) {
  const policyLeads = getCandidatePolicyLeads(candidate);
  const otherPolicyLeads = new Set(
    ballotCandidates
      .filter((item) => item.id !== candidate.id)
      .flatMap((item) => getCandidatePolicyLeads(item)),
  );
  const distinctiveLeads = policyLeads.filter((lead) => !otherPolicyLeads.has(lead));
  const candidateTopics = inferPolicyTopics(policyLeads);
  const otherTopics = inferPolicyTopics(Array.from(otherPolicyLeads));
  const details: string[] = [];

  if (distinctiveLeads.length > 0) {
    details.push(`눈에 띄는 고유 공약: ${distinctiveLeads.slice(0, 3).join(", ")}.`);
  } else if (policyLeads.length > 0) {
    details.push(`주요 공약 축: ${policyLeads.slice(0, 3).join(", ")}.`);
  }

  if (candidateTopics.length > 0) {
    const topicText = formatTopicList(candidateTopics, 3);
    const otherTopicText =
      otherTopics.length > 0 ? ` 다른 후보의 ${formatTopicList(otherTopics, 3)} 공약과` : " 다른 후보 공약과";
    details.push(`다른 후보와 나눠볼 지점: 이 후보는 ${topicText}에 무게를 둡니다.${otherTopicText} 우선순위와 대상이 갈립니다.`);
  }

  if (policyLeads.length > 0) {
    details.push("확인할 부분: 제목만으로 판단하지 말고 재원, 일정, 협의 주체가 원문에 얼마나 구체적으로 적혔는지 봐야 합니다.");
  }

  if (details.length > 0) {
    return details;
  }

  return [
    "같은 투표지 후보와 정당, 전과, 재산·납세, 경력 같은 공개 기본정보를 나란히 확인해 보세요.",
    "후보별 공개 자료는 관련 링크에서 직접 확인할 수 있습니다.",
  ];
}

function getCandidatePolicyLeads(candidate: Candidate) {
  const sourcePledges = getCandidatePersonaSourcePledges(candidate.id);
  const policyLeads =
    sourcePledges.length > 0
      ? sourcePledges.map((pledge) => pledge.title)
      : [
          ...candidate.pledgeHighlights,
          ...getDisplayPledges(candidate, sourcePledges).map((pledge) => pledge.title),
        ];

  return unique(policyLeads)
    .map((item) => item.trim())
    .filter(isVoterFacingPolicyLead);
}

function isVoterFacingComparisonText(value: string) {
  const detail = value.trim();

  return (
    detail.length > 0 &&
    !detail.startsWith("공통 경쟁 분야:") &&
    !detail.startsWith("비교 범위:") &&
    !detail.startsWith("선거구 기준:") &&
    detail !== "같은 선거구 안에서 겹치는 핵심 키워드는 적습니다." &&
    !containsImplementationLanguage(detail)
  );
}

function isGenericComparisonSummary(value: string) {
  return /후보\/정당과 (?:함께 )?비교 대상입니다/.test(value) || /투표지에서 \d+개 후보\/정당/.test(value);
}

function isVoterFacingPolicyLead(value: string) {
  const lead = value.trim();

  return lead.length >= 4 && !containsImplementationLanguage(lead);
}

function containsImplementationLanguage(value: string) {
  return [
    "5대공약 PDF가 제공",
    "원문 기반 요약",
    "요약·비교 생성 대상",
    "후보 사진",
    "NEC CDN",
    "CDN 썸네일",
    "URL 확보",
    "AI 요약",
    "생성 대기",
    "메타데이터",
    "PDF 확보",
    "PDF 공개",
    "PDF 링크",
    "PDF 미제공",
    "원문 PDF",
    "원문 텍스트",
    "선거공보 연동",
    "공보 상세 연동",
    "row 확보",
    "공개 공약 정보가 부족",
    "공약 차이를 판단할 원문 정보가 부족",
    "정제 단계",
    "링크 없음",
  ].some((pattern) => value.includes(pattern));
}

function inferPolicyTopics(policyLeads: string[]) {
  const topicMatchers = [
    { label: "교통", pattern: /교통|통근|버스|지하철|철도|도로|환승|광역/ },
    { label: "주거·도시", pattern: /주거|주택|공간|도시|도심|재개발|부동산|정비/ },
    { label: "청년·일자리", pattern: /청년|창업|일자리|고용|노동|취업/ },
    { label: "돌봄·교육", pattern: /돌봄|교육|학교|아이|아동|보육|학생/ },
    { label: "복지·안전", pattern: /복지|안전|폭력|성착취|노년|어르신|건강|의료/ },
    { label: "경제·규제", pattern: /경제|규제|소상공|시장|산업|기업|세금/ },
    { label: "행정혁신", pattern: /행정|AI|혁신|효율|디지털|구조 개혁/ },
    { label: "환경", pattern: /환경|기후|녹지|공원|탄소|에너지/ },
  ];
  const labels = policyLeads.flatMap((lead) =>
    topicMatchers.filter(({ pattern }) => pattern.test(lead)).map(({ label }) => label),
  );

  return unique(labels);
}

function formatTopicList(topics: string[], limit = 2) {
  return topics.slice(0, limit).join(", ");
}

function formatPolicyLeadList(policyLeads: string[], limit = 2) {
  return policyLeads.slice(0, limit).join(", ");
}

function ExpandableText({
  text,
  label,
  collapsedLength = 150,
}: {
  text: string;
  label: string;
  collapsedLength?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const shouldCollapse = text.length > collapsedLength;
  const visibleText = expanded || !shouldCollapse ? text : text.slice(0, collapsedLength).trim();

  return (
    <span className="expandable-copy">
      <span>{visibleText}</span>
      {shouldCollapse ? (
        <button
          type="button"
          className="inline-more-button"
          onClick={() => setExpanded((value) => !value)}
          aria-label={expanded ? `${label} 접기` : `${label} 더보기`}
        >
          {expanded ? "접기" : "더보기"}
        </button>
      ) : null}
    </span>
  );
}

function getPledgeDetailLabel(pledge: Candidate["fullPledges"][number]) {
  return /링크 없음|원문 텍스트 확보|원문 PDF 확보|원문 확보/.test(pledge.title) ? "상태" : "어떻게";
}

function getVoterPledgeDetail(pledge: Candidate["fullPledges"][number]) {
  if (isInternalSourcePath(pledge.detail)) {
    return "공약 원문 텍스트가 확보되어 있습니다. 세부 내용은 원문 확인이 필요합니다.";
  }

  if (/\/PDF\//.test(pledge.detail)) {
    return "공약 원문 파일이 공개되어 있습니다. 세부 내용은 원문에서 확인해 주세요.";
  }

  if (pledge.detail.includes("PDF 원문에서 추출한 공약 제목입니다") || pledge.detail.includes("정제 단계")) {
    return "공약 제목은 원문에서 확인되었습니다. 세부 실행 내용은 원문 확인이 필요합니다.";
  }

  return pledge.detail;
}

function isInternalSourcePath(value: string) {
  return /^(?:data|public|dist)\//.test(value) || /(?:bulletin-texts|pdfs)\//.test(value);
}

function getDisplayPledges(candidate: Candidate, sourcePledges = getCandidatePersonaSourcePledges(candidate.id)) {
  return sourcePledges.length > 0 ? sourcePledges : candidate.fullPledges.filter(isDisplayablePledge);
}

function getPledgeAvailabilityNotice(candidate: Candidate) {
  if (candidate.numberLabel === "정당투표") {
    return "비례대표 정당 투표 항목입니다. 정당별 공보와 정책 자료는 선관위 원문에서 확인해 주세요.";
  }

  if (candidate.cache.policyPdf === "NEC row metadata only") {
    return "선관위 후보 기본정보는 확인됐지만 공식 공약 원문 링크는 아직 확보되지 않았습니다.";
  }

  if (candidate.publicRecord.some((record) => record.includes("후보자 정보공개 원문 있음"))) {
    return "공약 PDF는 별도로 확인되지 않았지만 후보자 정보공개 원문에서 기본 공개자료를 확인할 수 있습니다.";
  }

  if (candidate.publicRecord.some((record) => /(?:5대공약|선거공보) PDF 있음/.test(record))) {
    return "공식 원문 PDF는 공개되어 있으나 자동으로 구조화 가능한 공약 문장이 부족해 원문 확인이 필요합니다.";
  }

  return "선관위 관련 페이지에서 후보 공개 자료와 공약 원문 여부를 확인해 주세요.";
}

function isDisplayablePledge(pledge: Candidate["fullPledges"][number]) {
  return pledge.title.trim().length > 0 && !containsImplementationLanguage(pledge.title);
}

function RelatedSourceLinks() {
  return (
    <div className="source-links related-source-links">
      {necRelatedLinks.map((link) => (
        <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
          <ExternalLink aria-hidden="true" size={13} />
          <span>{link.name}</span>
        </a>
      ))}
    </div>
  );
}

function CandidateCard({
  candidate,
  ballotCandidates,
  profile,
  onOpen,
}: {
  candidate: Candidate;
  ballotCandidates: Candidate[];
  profile: VoterProfile;
  onOpen: () => void;
}) {
  const comparisonPreview = getVoterComparisonPreview(candidate, ballotCandidates);
  const comparisonCardDetails = getVoterComparisonCardDetails(candidate, ballotCandidates);
  const factCheckReview = getCandidateFactCheck(candidate.id);
  const personaReview = getCandidatePersonaReviewForCandidate(candidate, profile);
  const sourcePledges = getCandidatePersonaSourcePledges(candidate.id);
  const displayPledges = getDisplayPledges(candidate, sourcePledges);
  const primaryPledges = displayPledges.slice(0, 2);
  const pledgeSummary =
    sourcePledges.length === 0 && !containsImplementationLanguage(candidate.pledgeSummary) ? candidate.pledgeSummary : "";
  const hasVisiblePledges = primaryPledges.length > 0;
  const pledgeAvailabilityNotice = hasVisiblePledges ? "" : getPledgeAvailabilityNotice(candidate);

  return (
    <article
      className="candidate-card"
      aria-label={`${candidate.name} 후보 카드`}
      style={{ "--candidate-color": candidate.color } as CSSProperties}
    >
      <header className="candidate-card__header">
        <CandidatePhoto candidate={candidate} />
        <div className="candidate-identity">
          <p>{candidate.office}</p>
          <h3>{candidate.name}</h3>
          <strong className="party-name">{candidate.party}</strong>
        </div>
        <strong className="ballot-number">{candidate.numberLabel ?? `기호 ${candidate.number}`}</strong>
      </header>

      <div className="meta-row">
        <span>{candidate.age > 0 ? `${candidate.age}세` : "연령 정보 확인 필요"}</span>
        <span>{candidate.occupation}</span>
      </div>

      <span className={`record-pill record-pill--static record-pill--${candidate.criminalRecord.tone}`}>
        {getCandidateToneIcon(candidate)}
        <span>{candidate.criminalRecord.summary}</span>
      </span>

      <section className="card-section pledge-list" aria-label={`${candidate.name} 공약 요약`}>
        <div className="card-section__title">
          <FileText aria-hidden="true" size={16} />
          <h4>{hasVisiblePledges ? "공약 요약" : "관련 링크"}</h4>
        </div>
        {pledgeSummary ? <p className="summary-text">{pledgeSummary}</p> : null}
        {hasVisiblePledges ? (
          <div className="pledge-action-list">
            {primaryPledges.map((pledge, index) => (
              <article className="pledge-action" key={pledge.title}>
                <span className="pledge-action__meta">공약 {index + 1}</span>
                <strong>{pledge.title}</strong>
                <p>
                  <span>{getPledgeDetailLabel(pledge)}</span>
                  <ExpandableText text={getVoterPledgeDetail(pledge)} label={`${candidate.name} 공약 ${index + 1}`} />
                </p>
              </article>
            ))}
          </div>
        ) : (
          <>
            <p className="summary-text">{pledgeAvailabilityNotice}</p>
            <RelatedSourceLinks />
          </>
        )}
      </section>

      <section className="card-section comparison-summary" aria-label={`${candidate.name} 비교 요약`}>
        <div className="card-section__title">
          <Scale aria-hidden="true" size={16} />
          <h4>차별점</h4>
        </div>
        <p>{comparisonPreview}</p>
        <ul>
          {comparisonCardDetails.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
        <button
          type="button"
          className="inline-more-button inline-more-button--standalone"
          onClick={onOpen}
          aria-label={`${candidate.name} 차별점 더보기`}
        >
          차별점 더보기
          <ChevronRight aria-hidden="true" size={14} />
        </button>
      </section>

      {factCheckReview ? (
        <section
          className={`card-section fact-check-summary fact-check-summary--${factCheckReview.tone}`}
          aria-label={`${candidate.name} 공약 팩트체크`}
        >
          <div className="card-section__title">
            <ShieldCheck aria-hidden="true" size={16} />
            <h4>팩트체크</h4>
          </div>
          <p>{factCheckReview.summary}</p>
          <ul>
            {factCheckReview.items.slice(0, 2).map((item) => (
              <li key={`${item.verdict}-${item.claim}`}>
                <strong>{item.verdict}</strong>
                {item.claim}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className={personaReview ? "profile-fit profile-fit--review" : "profile-fit"}>
        <strong>{profile} 관점</strong>
        <span>{personaReview?.summary ?? candidate.profileRelevance[profile]}</span>
        {personaReview ? <small>선관위 제공 정보만 기반</small> : null}
      </div>

      <button type="button" className="open-button" onClick={onOpen}>
        <FileText aria-hidden="true" size={16} />
        <span>전체 공약 보기</span>
        <ChevronRight aria-hidden="true" size={16} />
      </button>
    </article>
  );
}

function getDataModeLabel(mode: CacheManifest["dataMode"]) {
  if (mode === "mock") {
    return "시제품 데이터";
  }

  if (mode === "mixed") {
    return "선관위 자료 기반";
  }

  return "선관위 자료 기반";
}

function CandidatePhoto({ candidate }: { candidate: Candidate }) {
  if (candidate.photoUrl) {
    return (
      <img
        className="portrait portrait--image"
        src={candidate.photoUrl}
        alt={`${candidate.name} 후보 사진`}
        style={{ "--candidate-color": candidate.color } as CSSProperties}
      />
    );
  }

  return (
    <div
      className="portrait portrait--placeholder"
      role="img"
      aria-label={`${candidate.name} 후보 사진`}
      style={{ "--candidate-color": candidate.color } as CSSProperties}
    >
      <span>사진</span>
    </div>
  );
}

function CandidateDialog({
  candidate,
  ballotCandidates,
  profile,
  onClose,
}: {
  candidate: Candidate;
  ballotCandidates: Candidate[];
  profile: VoterProfile;
  onClose: () => void;
}) {
  const comparisonDetails = getVoterComparisonDetails(candidate, ballotCandidates);
  const factCheckReview = getCandidateFactCheck(candidate.id);
  const personaReview = getCandidatePersonaReviewForCandidate(candidate, profile);
  const sourcePledges = getCandidatePersonaSourcePledges(candidate.id);
  const displayPledges = getDisplayPledges(candidate, sourcePledges);
  const hasVisiblePledges = displayPledges.length > 0;
  const pledgeAvailabilityNotice = hasVisiblePledges ? "" : getPledgeAvailabilityNotice(candidate);

  return (
    <div className="dialog-backdrop">
      <section
        className="candidate-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="candidate-dialog-title"
      >
        <header className="dialog-header">
          <div>
            <p className="eyebrow">{candidate.office}</p>
            <h2 id="candidate-dialog-title">{candidate.name} 전체 공약</h2>
          </div>
          <button type="button" className="icon-button" aria-label="닫기" onClick={onClose}>
            <X aria-hidden="true" size={18} />
          </button>
        </header>

        <div className="dialog-body">
          <section className="detail-section">
            <h3>후보자 공개 정보</h3>
            <p>{candidate.criminalRecord.summary}</p>
            <div className="public-records">
              {candidate.publicRecord.map((record) => (
                <span key={record}>{record}</span>
              ))}
            </div>
          </section>

          <section className="detail-section">
            <h3>{hasVisiblePledges ? "5대 공약" : "관련 링크"}</h3>
            {hasVisiblePledges ? (
              <ol className="full-pledges">
                {displayPledges.map((pledge) => (
                  <li key={pledge.title}>
                    <strong>{pledge.title}</strong>
                    <span>
                      <em>{getPledgeDetailLabel(pledge)}</em>
                      {getVoterPledgeDetail(pledge)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <>
                <p>{pledgeAvailabilityNotice}</p>
                <RelatedSourceLinks />
              </>
            )}
          </section>

          <section className="detail-section">
            <h3>상대 후보와의 차별점</h3>
            <ul className="difference-list">
              {comparisonDetails.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </section>

          {factCheckReview ? (
            <section className={`detail-section fact-check-detail fact-check-detail--${factCheckReview.tone}`}>
              <h3>공약 팩트체크</h3>
              <p>{factCheckReview.summary}</p>
              <div className="fact-check-list">
                {factCheckReview.items.map((item) => (
                  <article key={`${item.verdict}-${item.claim}`} className="fact-check-item">
                    <span>{item.verdict}</span>
                    <strong>{item.claim}</strong>
                    <p>{item.check}</p>
                    <div className="source-links">
                      {item.sources.map((source) => (
                        <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                          {source.name}
                        </a>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className="detail-section">
            <h3>{profile} 관점</h3>
            {personaReview ? (
              <div className="persona-detail">
                <p>{personaReview.summary}</p>
                <p className="persona-notice">{personaReview.sourceNotice}</p>
                <p className="persona-scope">{personaReviewScopeNotice}</p>
                <div className="persona-grid">
                  <div>
                    <h4>눈여겨볼 점</h4>
                    <ul className="difference-list">
                      {personaReview.highlights.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>물어볼 질문</h4>
                    <ul className="difference-list">
                      {personaReview.questions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div>
                  <h4>보수적으로 볼 점</h4>
                  <ul className="difference-list">
                    {personaReview.cautions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="persona-evidence">
                  <h4>근거 출처</h4>
                  <ul>
                    {personaReview.evidence.map((source) => (
                      <li key={`${source.kind}-${source.sourcePath}-${source.label}`}>
                        <strong>{source.kind === "candidateMetadata" ? "후보자 정보" : "공약 원문"}</strong>
                        <span>{source.label}</span>
                        {source.snippet ? <em>{source.snippet}</em> : null}
                        <small>{source.sourcePath}</small>
                      </li>
                    ))}
                  </ul>
                </div>
                <details className="prompt-disclosure">
                  <summary>프롬프트 보기</summary>
                  <pre>{personaReview.prompt}</pre>
                </details>
              </div>
            ) : (
              <p>{candidate.profileRelevance[profile]}</p>
            )}
          </section>

          <footer className="dialog-source">
            <FileText aria-hidden="true" size={16} />
            <span>선관위 정책공약마당 · 후보자 정보공개</span>
            <strong>{candidate.cache.normalizedAt.slice(0, 10)}</strong>
          </footer>
        </div>
      </section>
    </div>
  );
}
