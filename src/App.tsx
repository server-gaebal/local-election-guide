import {
  BadgeCheck,
  ChevronRight,
  CircleAlert,
  Database,
  FileText,
  Filter,
  Landmark,
  MapPin,
  Scale,
  ShieldCheck,
  UserRound,
  Vote,
  X,
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

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function getCandidateToneIcon(candidate: Candidate) {
  if (candidate.criminalRecord.tone === "clean") {
    return <ShieldCheck aria-hidden="true" size={16} />;
  }

  return <CircleAlert aria-hidden="true" size={16} />;
}

function findInitialResidence(residences: Residence[]): Residence | null {
  return residences[0] ?? null;
}

function getBallotId(candidate: Candidate) {
  return `${candidate.residenceId}:${candidate.office}`;
}

function getBallotTitle(candidate: Candidate) {
  return `${candidate.office} 후보`;
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
      order: raceOrder[candidate.race],
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
  const [profile, setProfile] = useState<VoterProfile>("청년");
  const [ballotFilter, setBallotFilter] = useState<BallotFilter>(allRaces);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    let isActive = true;

    Promise.all([loadCacheManifest(), loadRegionIndex()])
      .then(([nextManifest, nextRegionIndex]) => {
        if (!isActive) {
          return;
        }

        const nextResidence = findInitialResidence(nextRegionIndex.residences);
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

  const residences = regionIndex?.residences ?? [];
  const voterProfiles = regionIndex?.voterProfiles ?? [];
  const initialResidence = findInitialResidence(residences);

  const cities = useMemo(() => unique(residences.map((residence) => residence.city)), [residences]);
  const districts = useMemo(
    () => unique(residences.filter((residence) => residence.city === city).map((residence) => residence.district)),
    [city],
  );
  const neighborhoods = useMemo(
    () =>
      unique(
        residences
          .filter((residence) => residence.city === city && residence.district === district)
          .map((residence) => residence.neighborhood),
      ),
    [city, district],
  );

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

  const ballotGroups = useMemo(() => createBallotGroups(regionalCandidates), [regionalCandidates]);

  const ballotOptions = useMemo(
    () => [allRaces, ...ballotGroups.map((group) => group.id)],
    [ballotGroups],
  );

  const visibleBallotGroups = useMemo(
    () => ballotGroups.filter((group) => ballotFilter === allRaces || group.id === ballotFilter),
    [ballotFilter, ballotGroups],
  );

  const visibleCandidates = useMemo(
    () => visibleBallotGroups.flatMap((group) => group.candidates),
    [visibleBallotGroups],
  );

  const totalCandidateCount = useMemo(
    () => ballotGroups.reduce((sum, group) => sum + group.candidates.length, 0),
    [ballotGroups],
  );

  const comparisonLines = visibleCandidates.flatMap((candidate) =>
    candidate.comparisonDetails.slice(0, 1).map((detail) => ({
      candidate: candidate.name,
      detail,
    })),
  );

  const handleCityChange = (nextCity: string) => {
    const nextResidence = residences.find((residence) => residence.city === nextCity) ?? initialResidence;
    if (!nextResidence) {
      return;
    }

    setCity(nextResidence.city);
    setDistrict(nextResidence.district);
    setNeighborhood(nextResidence.neighborhood);
    setBallotFilter(allRaces);
    setSelectedCandidate(null);
  };

  const handleDistrictChange = (nextDistrict: string) => {
    const nextResidence =
      residences.find((residence) => residence.city === city && residence.district === nextDistrict) ??
      initialResidence;

    if (!nextResidence) {
      return;
    }

    setDistrict(nextResidence.district);
    setNeighborhood(nextResidence.neighborhood);
    setBallotFilter(allRaces);
    setSelectedCandidate(null);
  };

  const handleNeighborhoodChange = (nextNeighborhood: string) => {
    setNeighborhood(nextNeighborhood);
    setBallotFilter(allRaces);
    setSelectedCandidate(null);
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
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            <Vote size={24} />
          </span>
          <div>
            <p className="eyebrow">{manifest.dataMode === "mock" ? "STATIC MOCK DATA" : "NEC STATIC DATA"}</p>
            <h1>지방선거 가이드</h1>
          </div>
        </div>
        <div className="cache-strip" aria-label="캐시 상태">
          <Database aria-hidden="true" size={16} />
          <span>정적 JSON 캐시</span>
          <strong>{manifest.version}</strong>
        </div>
      </header>

      <section className="selector-band" aria-label="유권자 조건">
        <div className="civic-visual" aria-hidden="true">
          <div className="civic-visual__map">
            <span className="map-pin map-pin--primary" />
            <span className="map-pin map-pin--secondary" />
            <span className="map-route" />
          </div>
          <div className="ballot-stack">
            <span />
            <span />
            <span />
          </div>
        </div>

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
                  onClick={() => setProfile(item)}
                >
                  {item}
                </button>
              ))}
            </div>
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
          <span>받는 투표지</span>
          <strong>{ballotGroups.length}종</strong>
        </div>
        <div className="status-tile">
          <UserRound aria-hidden="true" size={18} />
          <span>후보자</span>
          <strong>{totalCandidateCount}명</strong>
        </div>
        <div className="status-tile status-tile--cache">
          <Database aria-hidden="true" size={18} />
          <span>지역 캐시</span>
          <strong>{selectedResidence.cacheKey}</strong>
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
          <div className="cache-note">
            <BadgeCheck aria-hidden="true" size={16} />
            <span>{selectedResidence.cachedAt}</span>
          </div>
        </aside>

        <section className="candidate-area" aria-label="후보 목록">
          <div className="section-head">
            <div>
              <p className="eyebrow">{profile} 관점</p>
              <h2>{`${selectedResidence.city} ${selectedResidence.district} ${selectedResidence.neighborhood}에서 투표할 후보`}</h2>
            </div>
            <div className="result-count">
              <strong>{totalCandidateCount}</strong>
              <span>명</span>
            </div>
          </div>

          {regionDataset ? (
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
                        profile={profile}
                        onOpen={() => setSelectedCandidate(candidate)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="region-loading" aria-live="polite">
              <Database aria-hidden="true" size={18} />
              <span>{selectedResidence.cacheKey} 로딩 중</span>
            </div>
          )}
        </section>

        <aside className="comparison-panel" aria-label="요약 비교">
          <div className="panel-title">
            <Scale aria-hidden="true" size={18} />
            <h2>요약 비교</h2>
          </div>
          <div className="comparison-list">
            {comparisonLines.map((line) => (
              <div className="comparison-row" key={`${line.candidate}-${line.detail}`}>
                <strong>{line.candidate}</strong>
                <span>{line.detail}</span>
              </div>
            ))}
          </div>
          <div className="source-box">
            <FileText aria-hidden="true" size={16} />
            <span>{regionDataset?.source.sourceName ?? manifest.sourceName}</span>
          </div>
        </aside>
      </section>

      {selectedCandidate ? (
        <CandidateDialog candidate={selectedCandidate} profile={profile} onClose={() => setSelectedCandidate(null)} />
      ) : null}
    </main>
  );
}

function CandidateCard({
  candidate,
  profile,
  onOpen,
}: {
  candidate: Candidate;
  profile: VoterProfile;
  onOpen: () => void;
}) {
  return (
    <article className="candidate-card" aria-label={`${candidate.name} 후보 카드`}>
      <header className="candidate-card__header">
        <CandidatePhoto candidate={candidate} />
        <div className="candidate-identity">
          <p>{candidate.office}</p>
          <h3>{candidate.name}</h3>
          <strong className="party-name">{candidate.party}</strong>
        </div>
        <strong className="ballot-number">기호 {candidate.number}</strong>
      </header>

      <div className="meta-row">
        <span>{candidate.age}세</span>
        <span>{candidate.occupation}</span>
      </div>

      <div className={`record-pill record-pill--${candidate.criminalRecord.tone}`}>
        {getCandidateToneIcon(candidate)}
        <span>{candidate.criminalRecord.summary}</span>
      </div>

      <div className="tag-row">
        {candidate.focusTags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>

      <p className="summary-text">{candidate.pledgeSummary}</p>

      <div className="pledge-list">
        <h4>공약 요약</h4>
        <ul>
          {candidate.pledgeHighlights.map((pledge) => (
            <li key={pledge}>{pledge}</li>
          ))}
        </ul>
      </div>

      <div className="compare-callout">
        <Scale aria-hidden="true" size={16} />
        <span>{candidate.comparison}</span>
      </div>

      <div className="profile-fit">
        <strong>{profile}</strong>
        <span>{candidate.profileRelevance[profile]}</span>
      </div>

      <button type="button" className="open-button" onClick={onOpen}>
        <FileText aria-hidden="true" size={16} />
        <span>전체 공약 보기</span>
        <ChevronRight aria-hidden="true" size={16} />
      </button>
    </article>
  );
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
  profile,
  onClose,
}: {
  candidate: Candidate;
  profile: VoterProfile;
  onClose: () => void;
}) {
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
            <h3>범죄 기록</h3>
            <p>{candidate.criminalRecord.details}</p>
            <div className="public-records">
              {candidate.publicRecord.map((record) => (
                <span key={record}>{record}</span>
              ))}
            </div>
          </section>

          <section className="detail-section">
            <h3>5대 공약</h3>
            <ol className="full-pledges">
              {candidate.fullPledges.map((pledge) => (
                <li key={pledge.title}>
                  <strong>{pledge.title}</strong>
                  <span>{pledge.detail}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="detail-section">
            <h3>상대 후보와의 차이</h3>
            <ul className="difference-list">
              {candidate.comparisonDetails.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </section>

          <section className="detail-section">
            <h3>{profile} 관점</h3>
            <p>{candidate.profileRelevance[profile]}</p>
          </section>

          <footer className="dialog-source">
            <Database aria-hidden="true" size={16} />
            <span>{candidate.cache.policyPdf}</span>
            <strong>{candidate.cache.normalizedAt}</strong>
          </footer>
        </div>
      </section>
    </div>
  );
}
