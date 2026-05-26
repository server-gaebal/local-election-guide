import { describe, expect, it } from "vitest";
import type { Residence } from "./electionTypes";
import { createCandidateInfoIndex, type NecCandidateInfoRecord } from "./necCandidateInfo";
import {
  buildResidenceDatasetFromNec,
  extractPledges,
  extractPolicyTags,
  extractPledgeTitles,
  type NecDownloadIndex,
} from "./necRegionCache";
import type { NecNormalizedCandidate } from "./necCrawler";

const residence: Residence = {
  id: "seoul-mapo-gongdeok",
  city: "서울특별시",
  district: "마포구",
  neighborhood: "공덕동",
  cacheKey: "residence:seoul:mapo:gongdeok:v1",
  cachedAt: "2026-05-26 13:30 KST",
};

const busanResidence: Residence = {
  id: "nec-2600-2601-5260101-6260101",
  city: "부산광역시",
  district: "중구",
  neighborhood: "중구선거구 · 중구가선거구",
  cacheKey: "nec:scope:2600:2601:5260101:6260101:v1",
  cachedAt: "2026-05-26T13:30:00+09:00",
  electionScope: {
    cityCouncilDistrict: "중구선거구",
    localCouncilDistrict: "중구가선거구",
  },
};

const suwonResidence: Residence = {
  id: "nec-4100-4101-dong-1qhklm1",
  city: "경기도",
  district: "수원시 장안구",
  neighborhood: "파장동",
  cacheKey: "nec:area:4100:4101:파장동:v1",
  cachedAt: "2026-05-26T13:30:00+09:00",
  electionScope: {
    districtHeadDistrict: "수원시",
    cityCouncilDistrict: "수원시제1선거구",
    localCouncilDistrict: "수원시나선거구",
  },
};

function necRow(overrides: Partial<NecNormalizedCandidate>): NecNormalizedCandidate {
  return {
    id: overrides.id ?? "row",
    electionId: "20260603",
    subElectionId: overrides.subElectionId ?? "320260603",
    raceTypeCode: overrides.raceTypeCode ?? "3",
    raceName: overrides.raceName ?? "시·도지사선거",
    districtId: "",
    districtName: overrides.districtName ?? "서울특별시",
    partyId: overrides.partyId ?? "100",
    partyName: overrides.partyName ?? "더불어민주당",
    candidateId: overrides.candidateId ?? "100",
    candidateNumber: overrides.candidateNumber ?? "1",
    name: overrides.name ?? "정원오",
    occupation: overrides.occupation ?? "정당인",
    education: "",
    thumbnailPath: "",
    thumbnailUrl: overrides.thumbnailUrl ?? "https://cdn.nec.go.kr/photo_20260603/sample.JPG",
    fivePledgePdf:
      overrides.fivePledgePdf === undefined
        ? {
            requestedFileName: "sample.pdf",
            requestedFullPath: "20260603/PDF/P5_PRMS_PUB/sample.pdf",
            downloadUrl: "https://policy.nec.go.kr/sample.pdf",
          }
        : overrides.fivePledgePdf,
    campaignBulletinPdf: overrides.campaignBulletinPdf ?? null,
  };
}

function candidateInfoRecord(overrides: Partial<NecCandidateInfoRecord>): NecCandidateInfoRecord {
  return {
    candidateId: overrides.candidateId ?? "100",
    districtName: overrides.districtName ?? "서울특별시",
    number: overrides.number ?? "1",
    partyName: overrides.partyName ?? "더불어민주당",
    name: overrides.name ?? "정원오",
    gender: overrides.gender ?? "남",
    birthDate: overrides.birthDate ?? "1968.08.12",
    age: overrides.age ?? 57,
    address: overrides.address ?? "서울특별시 성동구",
    occupation: overrides.occupation ?? "정당인",
    education: overrides.education ?? "한양대학교 도시대학원 박사 수료",
    career: overrides.career ?? "(전)성동구청장",
    assets: overrides.assets ?? "1,823,897",
    military: overrides.military ?? "군복무를 마친사람",
    taxPaid: overrides.taxPaid ?? "84,423",
    taxArrearsFiveYears: overrides.taxArrearsFiveYears ?? "0",
    taxCurrentArrears: overrides.taxCurrentArrears ?? "0",
    crimeRecord: overrides.crimeRecord ?? "없음",
    electionCount: overrides.electionCount ?? "0회",
    crimeDisclosureFiles: overrides.crimeDisclosureFiles ?? [],
  };
}

describe("NEC residence cache builder", () => {
  it("extracts pledge titles from pdftotext output", () => {
    const text = `
공약순위: 1 제목 : AI로 똑똑한 행정, 안전은 미리미리
□ 목표
교통 안전 데이터를 활용해 보행 사고를 줄입니다.
공약순위: 2 제목 : 사는 동네가 달라집니다
□ 목표
공공주택과 역세권 주거 공급을 늘립니다.
공약순위: 3 제목 : 돌봄은 제도가 아니라 일상
□ 목표
어르신과 아동 돌봄 서비스를 동네에서 연결합니다.
`;

    expect(extractPledgeTitles(text)).toEqual([
      "AI로 똑똑한 행정, 안전은 미리미리",
      "사는 동네가 달라집니다",
      "돌봄은 제도가 아니라 일상",
    ]);
    expect(extractPledges(text)[0]).toEqual({
      title: "AI로 똑똑한 행정, 안전은 미리미리",
      detail: "교통 안전 데이터를 활용해 보행 사고를 줄입니다.",
    });
    expect(extractPolicyTags(text)).toEqual(expect.arrayContaining(["안전", "복지", "주거"]));
  });

  it("extracts pledge titles when NEC omits the 공약순위 label", () => {
    const text = `
      선거명     서울특별시교육감선거        후보자명       이학인
순위 : 1        제목 : 서울을 하나로, 선택은 무제한

o 목표
학생의 선택권을 보장하고 공교육 수준을 상향 평준화

o 이행 방법
거주자 상관 없이 원하는 학교 선택
-고등학교 서울 단일 학군제 실시 (학군제 폐지)
-학교 선택을 위한 맞춤형 학교 정보 제공

      선거명     서울특별시교육감선거        후보자명       이학인
순위 : 2        제목 : 사교육비 절감, 사교육 형평성 강화와 부담 경감

o 목표
사교육비 경감과 사교육 의존을 낮추고 공교육의 보완재로 기능 변화

o 이행 방법
과열된 사교육 지역 분산
-지역(구)별 학원 총량제 실시로 서울시 전역으로 분산 유도
`;

    expect(extractPledgeTitles(text)).toEqual([
      "서울을 하나로, 선택은 무제한",
      "사교육비 절감, 사교육 형평성 강화와 부담 경감",
    ]);
    expect(extractPledges(text)[0]).toEqual({
      title: "서울을 하나로, 선택은 무제한",
      detail:
        "거주자 상관 없이 원하는 학교 선택 고등학교 서울 단일 학군제 실시 (학군제 폐지) 학교 선택을 위한 맞춤형 학교 정보 제공",
    });
  });

  it("extracts pledge variants from loosely formatted five-pledge PDFs", () => {
    const text = `
\f 선거명 전남광주통합특별시장선거 후보자명 민형배
공약순위 성장통합 신산업 성장으로 일자리와 소득을 키우겠습니다
□ 목 표
전남광주통합특별시를 대한민국 남부권 신산업 수도로 육성
□ 이행방법
권역별 신성장 산업벨트 조성
- 광주권: AI, 미래모빌리티, 반도체 산업 육성
\f 선거명 강북구청장선거 후보자명 장지호
[공약 1순위] 24시간 어린이 안심의료센터 구축
□목표
강북구 내 소아 응급의료 공백 해소
□ 이행방법
[1단계] 보건소 산하 소아 안심 응급의료센터 거점 구축
- 야간·휴일 소아 전문 진료실 설치
\f 선거명 봉화군수선거 후보자명 최기영
공약순서: 1 제목: 6차 산업 농업단지 조성사업
□ 목 표
가공·유통·체험·관광이 결합된 농업 구조
□ 이행방법
농산물 부가가치 창출 기반 구축
`;

    expect(extractPledges(text)).toEqual([
      {
        title: "성장통합 신산업 성장으로 일자리와 소득을 키우겠습니다",
        detail: "권역별 신성장 산업벨트 조성 광주권: AI, 미래모빌리티, 반도체 산업 육성",
      },
      {
        title: "24시간 어린이 안심의료센터 구축",
        detail: "[1단계] 보건소 산하 소아 안심 응급의료센터 거점 구축 야간·휴일 소아 전문 진료실 설치",
      },
      {
        title: "6차 산업 농업단지 조성사업",
        detail: "농산물 부가가치 창출 기반 구축",
      },
    ]);
  });

  it("extracts pledge highlights from campaign bulletin text without five-pledge headings", () => {
    const text = `
후보자 정보 공개자료
인적사항
북수원이 달라집니다
1. 신산업 유치
- 북수원 테크로밸리 조성 추진
- 영화도시재생혁신지구 추진
2. 편리한 지하철 시대
- 동탄인덕원선 및 신분당선 조기 개통
- 수원도시철도 1호선 조기 추진
3. 수원의 미래
- 재개발ㆍ재건축 조속추진 행ㆍ재정적 지원
4. 구도심 지역경제 활성화
- 전통시장 등 공용주차장 대폭 확충
5. 체육시설 확충
- 수원 돔구장 추진
`;

    expect(extractPledges(text)).toEqual([
      {
        title: "신산업 유치",
        detail: "북수원 테크로밸리 조성 추진 영화도시재생혁신지구 추진",
      },
      {
        title: "편리한 지하철 시대",
        detail: "동탄인덕원선 및 신분당선 조기 개통 수원도시철도 1호선 조기 추진",
      },
      {
        title: "수원의 미래",
        detail: "재개발ㆍ재건축 조속추진 행ㆍ재정적 지원",
      },
      {
        title: "구도심 지역경제 활성화",
        detail: "전통시장 등 공용주차장 대폭 확충",
      },
      {
        title: "체육시설 확충",
        detail: "수원 돔구장 추진",
      },
    ]);
  });

  it("extracts numbered promises from campaign bulletin layouts with padded numbers", () => {
    const text = `
서울시 1번지 종로 발전을 위한 윤선희의 ‘4대 약속’
01 교통해결
강북횡단선 경전철 조기 착공 추진으로 지역 교통불편 해결하겠습니다.
02 문화도약
광화문 빛의 광장 상시화로 지역 문화·예술·관광 랜드마크 조성
03 안전확충
스마트 보행 안전 시스템 확대로 어르신과 아이들의 이동 안전 확보
`;

    expect(extractPledges(text)).toEqual([
      {
        title: "교통해결",
        detail: "강북횡단선 경전철 조기 착공 추진으로 지역 교통불편 해결하겠습니다.",
      },
      {
        title: "문화도약",
        detail: "광화문 빛의 광장 상시화로 지역 문화·예술·관광 랜드마크 조성",
      },
      {
        title: "안전확충",
        detail: "스마트 보행 안전 시스템 확대로 어르신과 아이들의 이동 안전 확보",
      },
    ]);
  });

  it("extracts action pledges from duplicated two-column campaign bulletin layouts", () => {
    const text = `
책자형 선거공보
\f
검증된 실전형 지역 일꾼
01 01종로 서북권
종로 주민의 이동권, 반드시 찾아드리겠습니다.        02 02 세계가 주목할
서울시 예산으로 종로의 새 역사 만들겠습니다.

정릉~홍제
경전철 추진
종로구 문화
新랜드마크 건립
- 강북횡단선-평창구간 밀착 방어
- 김소월 문학관 건립
\f
3 03
내 집에서 고통받는 시대를 끝내겠습니다. 04 04 종로 서북권
한옥과 노후 주거환경 전면적 개선
키즈카페, 체육시설, 도그파크 등 생활편의시설 확충
반려동물 동반공원(도그파크) 조성
`;

    expect(extractPledges(text).map((pledge) => pledge.title)).toEqual(
      expect.arrayContaining([
        "정릉~홍제 경전철 추진",
        "종로구 문화 新랜드마크 건립",
        "김소월 문학관 건립",
        "한옥과 노후 주거환경 전면적 개선",
      ]),
    );
  });

  it("starts campaign bulletin action fallback from future pledge markers", () => {
    const text = `
책자형 선거공보
지방의원 매니페스토 약속대상
\f
앞으로 4년
해내겠습니다
신속한 정비사업 서초
재건축·재개발·모아타운 신속지원
노후 주거환경 개선으로 주거 가치를 높이겠습니다.
- 방배 정비사업 추진 지원
- 공사차량 통학로 진입 관리 - 임시 보행로·안전펜스 설치
교육의 품격을 완성하는 서초형 교육도시
- 서초중 체육관 및 급식실 신축 추진
`;

    const titles = extractPledges(text).map((pledge) => pledge.title);

    expect(titles).toEqual(
      expect.arrayContaining([
        "신속한 정비사업 서초",
        "재건축·재개발·모아타운 신속지원",
        "노후 주거환경 개선으로 주거 가치를 높이겠습니다.",
        "방배 정비사업 추진 지원",
      ]),
    );
    expect(titles.join(" ")).not.toContain("약속대상");
  });

  it("extracts numbered promises from letter-spaced campaign bulletin layouts", () => {
    const text = `
책자형 선거공보
후 보 자 정 보 공 개 자 료
1 인 적 사 항

“ 생 활 은 더 편 리 하 게 ”
1         빠 르 고 편 리 한 교 통 도 시 성 북
막 힘 없 는 출 근 길 로 체 감 하 는 내 삶 의 변 화
동 북 선 개 통 ( 2 0 2 7 년 1 1 월 예 정 ) 완 수 및 연 계 교 통 체 계 정 비
버 스 노 선 합 리 화 및 마 을 버 스 배 차 간 격 개 선

2        안 전 하 고 쾌 적 한 주 거 도 시 성 북
주 거 환 경 개 선 으 로 다 시 살 고 싶 은 동 네 로
주 민 부 담 최 소 화 ㆍ 신 속 한 재 개 발 등 주 거 정 비 사 업 추 진
소 규 모 노 후 주 거 지 정 비 사 업 확 대 추 진

3        아 이 키 우 기 좋 은 성 북
학 교 환 경 개 선 적 극 지 원
방 과 후 돌 봄 확 대
`;

    expect(extractPledges(text)).toEqual([
      {
        title: "빠르고편리한교통도시성북",
        detail:
          "막힘없는출근길로체감하는내삶의변화 동북선개통(2027년11월예정)완수및연계교통체계정비 버스노선합리화및마을버스배차간격개선",
      },
      {
        title: "안전하고쾌적한주거도시성북",
        detail: "주거환경개선으로다시살고싶은동네로 주민부담최소화ㆍ신속한재개발등주거정비사업추진 소규모노후주거지정비사업확대추진",
      },
      {
        title: "아이키우기좋은성북",
        detail: "학교환경개선적극지원 방과후돌봄확대",
      },
    ]);
  });

  it("extracts compact local pledge headings before candidate disclosure tables", () => {
    const text = `
김춘화의우리지역공약
삼락동삼락천악취문제
덕포시장&북부산시장활성화마중물역할
감전동감전시장활성화
우리지역함께열어가는공동체
괘법동신속한재개발추진과철저한공정관리
후보자정보공개자료
사상구의회의원선거(가선거구)
1. 인적사항
`;

    expect(extractPledges(text).map((pledge) => pledge.title)).toEqual([
      "삼락동삼락천악취문제",
      "덕포시장&북부산시장활성화마중물역할",
      "감전동감전시장활성화",
      "우리지역함께열어가는공동체",
      "괘법동신속한재개발추진과철저한공정관리",
    ]);
  });

  it("extracts local pledge lists around a standalone bulletin pledge heading", () => {
    const text = `
· 정의당 은평갑위원회 사무국장
· 권영국 당대표 사회복지정책 특보
약력 · 노회찬 · 심상정 사회복지정책 특보
은평구의회 외유성 출장 금지
소수자 · 여성 · 아이가 안전한 은평구, 안전 종합 점검
공약
보건복지 사각지대 발굴 봉산 · 불광천 난개발 금지
모바일 의정보고서 및 기타 자료 발행
`;

    expect(extractPledges(text).map((pledge) => pledge.title)).toEqual([
      "은평구의회 외유성 출장 금지",
      "소수자 · 여성 · 아이가 안전한 은평구, 안전 종합…",
      "보건복지 사각지대 발굴 봉산 · 불광천 난개발 금지",
      "모바일 의정보고서 및 기타 자료 발행",
    ]);
  });

  it("extracts bullet-style local promises with additional action words", () => {
    const text = `
• 주거 지역 주차 문제의 획기적인 개선책 마련
• 동대구 역에서 창원중앙역, 부산신항까지 철도 직선화
• 경노당 급식도우미 지원
`;

    expect(extractPledges(text).map((pledge) => pledge.title)).toEqual([
      "주거 지역 주차 문제의 획기적인 개선책 마련",
      "동대구 역에서 창원중앙역, 부산신항까지 철도 직선화",
      "경노당 급식도우미 지원",
    ]);
  });

  it("extracts explicit representative pledges without opening disclosure tables", () => {
    const text = `
후보 중 유일한 현역, 당선 즉시 일합니다!
대표공약 신속한 재개발·재건축, 지금 바로 시작 !!
윤보수(선거공보)_레이아웃 1 26. 5. 16. 오후 2:52 페이지 4
`;

    expect(extractPledges(text).map((pledge) => pledge.title)).toEqual(["신속한 재개발·재건축, 지금 바로 시작 !!"]);
  });

  it("does not synthesize pledge items when a bulletin says there are no pledges", () => {
    const text = `
아산시의회의원선거(아산시 라선거구)
“ 저는 공약이 없습니다 ”
후보자정보공개자료
아산시의회의원선거 (아산시 라선거구)
`;

    expect(extractPledges(text)).toEqual([]);
  });

  it("strips repeated title labels from extracted pledge titles", () => {
    const text = `
공약순위         제목    분 통근도시 실현으로 시민에게 쉼표를
목 표
분 통근도시 실현을 위한 교통망을 확충합니다.
이행방법
분 역세권 달성 격자형 철도망 구축
`;

    expect(extractPledgeTitles(text)).toEqual(["분 통근도시 실현으로 시민에게 쉼표를"]);
  });

  it("keeps OCR pledge titles on the title line instead of absorbing details", () => {
    const text = `
가 1 제목 : 어르신, 청년, 장애인 일자리 및 권익 창출
목표
O 세대별 맞춤 일자리 패키지로 모두가 자긍심 갖고 일할 수 있는 도시를 만들겠습니다.

공약순위: 2 AS: 재개발, 재건축 조속 실행 및 소상공인 지원
1} =
O 원스톱 추진단으로 인허가 절반 단축, 소상공인 상권 보호도 함께 챙기겠습니다.

공약순위: 3 제목 : 신평 예비군 훈련장 부지 복합체육문화시설
Oz 7 0
O 장기간 표류된 부지를 부산시, 국방부와 직접 협상해 복합 시설로 만들겠습니다.
`;

    expect(extractPledgeTitles(text)).toEqual([
      "어르신, 청년, 장애인 일자리 및 권익 창출",
      "재개발, 재건축 조속 실행 및 소상공인 지원",
      "신평 예비군 훈련장 부지 복합체육문화시설",
    ]);
  });

  it("prefers implementation method details so voters can see how a pledge would be done", () => {
    const text = `
공약순위: 1 제목 : 수도권 30분 출근 대전환
□ 목 표
○ 길 위에 버리는 시간을 도민에게 돌려주기 위한 광역교통망 구축
○ 이동에 대한 부담과 피로도를 덜어 도민의 보편적 이동권 보장을 확대
□ 이행방법
○ GTX 지체 없는 개통 추진
 - GTX-A·B: 안정적 사업 추진 및 원활한 공사 행정지원 지속
 - GTX-C·D: 조속한 착공을 위해 행정지원
○ 수도권 원(One)패스
 - 수도권의 다양한 교통패스를 하나의 수도권 원패스로 통합
□ 이행기간
○ 2026년~2027년, 연구용역 실시 및 도 재정사업에 대한 사업계획 수립
`;

    expect(extractPledges(text)[0]).toEqual({
      title: "수도권 30분 출근 대전환",
      detail:
        "GTX 지체 없는 개통 추진 GTX-A·B: 안정적 사업 추진 및 원활한 공사 행정지원 지속 GTX-C·D: 조속한 착공을 위해 행정지원 수도권 원(One)패스",
    });
  });

  it("does not turn candidate disclosure tables into campaign bulletin pledges", () => {
    const text = `
책자형선거공보 | 경기도의회의원선거 / 가평군 선거구
가평 예산,
바꾸겠습니다!
후보자 정보공개 자료
1. 인적사항
기호 소속정당명 후보자성명 성별
1       더불어민주당      박재현       남                    노인전문
(52세) (사회복지학) 박사과정 (현) 서정대학교
요양원시설장
4~5 | 정책로드맵
내 상황에 맞는 정책, 한 눈에 찾는 박재현의 공약 패키지     정책 로드맵
1                                             2            마을안길, 주차장,                       3
               공용화장실 추가 및 개방형화장실 지원                                                                     마을별 소규모 상하수도 설치 추진
4                                             5            군립의료원,                           6
               어르신 및 교통약자 교통사각지대 해소                                                                     관광연계형 활성화 시범사업 도입 추진
`;

    expect(extractPledges(text)).toEqual([]);
  });

  it("builds the selected residence ballot from matching NEC districts only", () => {
    const downloads: NecDownloadIndex = new Map([
      [
        "20260603-320260603-100",
        {
          textPath: "data/nec/full/pdfs/sample.txt",
          pledgeTitles: ["서울 공약 1", "서울 공약 2"],
          pledges: [
            { title: "서울 교통망 재편", detail: "버스와 지하철 환승 체계를 시비로 개편합니다." },
            { title: "청년 주거 지원", detail: "역세권 공공주택과 월세 지원을 확대합니다." },
          ],
          policyTags: ["교통", "주거", "청년"],
        },
      ],
    ]);
    const dataset = buildResidenceDatasetFromNec({
      residence,
      generatedAt: "2026-05-26T13:30:00+09:00",
      downloads,
      candidateInfo: createCandidateInfoIndex([
        {
          candidateId: "100",
          districtName: "서울특별시",
          number: "1",
          partyName: "더불어민주당",
          name: "정원오",
          gender: "남",
          birthDate: "1968.08.12",
          age: 57,
          address: "서울특별시 성동구",
          occupation: "정당인",
          education: "한양대학교 도시대학원 박사 수료",
          career: "(전)성동구청장",
          assets: "1,823,897",
          military: "군복무를 마친사람",
          taxPaid: "84,423",
          taxArrearsFiveYears: "0",
          taxCurrentArrears: "0",
          crimeRecord: "2건",
          electionCount: "3회",
          crimeDisclosureFiles: ["20260603/open/sample/junkwa/sample.tif"],
        },
      ]),
      candidates: [
        necRow({ id: "20260603-320260603-100", raceTypeCode: "3", raceName: "시·도지사선거", name: "정원오" }),
        necRow({ id: "education", raceTypeCode: "11", raceName: "교육감선거", name: "김영배", partyName: "무소속" }),
        necRow({ id: "mapo-head", raceTypeCode: "4", raceName: "구·시·군의 장선거", districtName: "마포구", name: "유동균" }),
        necRow({
          id: "city-council-1",
          raceTypeCode: "5",
          raceName: "시·도의회의원선거",
          districtName: "마포구제1선거구",
          name: "고병준",
          fivePledgePdf: null,
          campaignBulletinPdf: {
            requestedFileName: "고병준_선거공보.pdf",
            requestedFullPath: "20260603/PDF/PBINFO/1100/003_100_20260520_1.pdf",
            downloadUrl: "https://policy.nec.go.kr/bulletin.pdf",
          },
        }),
        necRow({
          id: "city-council-2",
          raceTypeCode: "5",
          raceName: "시·도의회의원선거",
          districtName: "마포구제2선거구",
          name: "한기영",
          fivePledgePdf: null,
        }),
        necRow({
          id: "local-council-a",
          raceTypeCode: "6",
          raceName: "구·시·군의회의원선거",
          districtName: "마포구가선거구",
          name: "장덕준",
          fivePledgePdf: null,
        }),
        necRow({
          id: "local-council-b",
          raceTypeCode: "6",
          raceName: "구·시·군의회의원선거",
          districtName: "마포구나선거구",
          name: "배동수",
          fivePledgePdf: null,
        }),
        necRow({
          id: "metro-prop",
          raceTypeCode: "8",
          raceName: "광역의원비례대표선거",
          districtName: "서울특별시",
          name: "",
          partyName: "국민의힘",
          candidateId: "",
          candidateNumber: "",
          fivePledgePdf: null,
        }),
        necRow({
          id: "local-prop",
          raceTypeCode: "9",
          raceName: "기초의원비례대표선거",
          districtName: "마포구",
          name: "",
          partyName: "더불어민주당",
          candidateId: "",
          candidateNumber: "",
          fivePledgePdf: null,
        }),
      ],
    });

    expect(dataset.candidates.map((candidate) => candidate.office)).toEqual([
      "서울특별시장",
      "서울특별시교육감",
      "마포구청장",
      "서울시의원 마포구제1선거구",
      "마포구의원 마포구가선거구",
      "서울시의원 비례대표",
      "마포구의원 비례대표",
    ]);
    expect(dataset.candidates.map((candidate) => candidate.name)).toContain("국민의힘 비례대표");
    const proportionalCandidate = dataset.candidates.find((candidate) => candidate.name === "국민의힘 비례대표");
    expect(proportionalCandidate?.cache.policyPdf).toContain("policy.nec.go.kr");
    expect(proportionalCandidate?.publicRecord).toContain("정책공약마당 원문 있음");
    expect(dataset.candidates.map((candidate) => candidate.name)).not.toContain("한기영");
    expect(dataset.candidates[0].age).toBe(57);
    expect(dataset.candidates[0].criminalRecord.summary).toBe("전과 2건");
    expect(dataset.candidates[0].criminalRecord.tone).toBe("risk");
    expect(dataset.candidates[0].publicRecord).toContain("재산신고액: 18억 2,389만 7천원");
    expect(dataset.candidates[0].publicRecord).toContain("납세 납부액: 8,442만 3천원");
    expect(dataset.candidates[0].pledgeSummary).toContain("교통·주거·청년");
    expect(dataset.candidates[0].comparison).toContain("서울 교통망 재편");
    expect(dataset.candidates[0].comparisonDetails[0]).toContain("비교 후보");
    expect(dataset.candidates[0].comparisonDetails.join(" ")).not.toContain("공통 경쟁 분야");
    expect(dataset.candidates[0].comparisonDetails.join(" ")).not.toContain("비교 범위");
    const comparisonDetailsText = dataset.candidates.flatMap((candidate) => candidate.comparisonDetails).join(" ");
    expect(comparisonDetailsText).not.toContain("후보 사진");
    expect(comparisonDetailsText).not.toContain("NEC CDN");
    expect(comparisonDetailsText).not.toContain("원문 기반 요약");
    expect(dataset.candidates[0].candidateTraits).toEqual(
      expect.arrayContaining(["더불어민주당 소속", expect.stringContaining("주요 경력:")]),
    );
    expect("feasibilityReview" in dataset.candidates[0]).toBe(false);
    expect(dataset.candidates[0].pledgeHighlights).toEqual(["서울 교통망 재편", "청년 주거 지원"]);
    expect(dataset.candidates[0].fullPledges[0].detail).toBe("버스와 지하철 환승 체계를 시비로 개편합니다.");
    expect(dataset.candidates.find((candidate) => candidate.name === "고병준")?.publicRecord).toContain("선거공보 PDF 있음");
    expect(dataset.candidates.find((candidate) => candidate.name === "고병준")?.pledgeSummary).toBe("");
    expect(dataset.candidates.find((candidate) => candidate.name === "고병준")?.pledgeHighlights).toEqual(["선거공보"]);
    expect(dataset.candidates.find((candidate) => candidate.name === "고병준")?.fullPledges).toEqual([]);
    expect(dataset.candidates.find((candidate) => candidate.name === "고병준")?.pledgeHighlights.join(" ")).not.toContain("후보 사진");
    const noDocumentCandidate = dataset.candidates.find((candidate) => candidate.name === "장덕준");
    expect(noDocumentCandidate?.publicRecord).not.toContain("공약 원문 PDF 링크 없음");
    expect(noDocumentCandidate?.pledgeSummary).toBe("");
    expect(noDocumentCandidate?.pledgeHighlights).toEqual([]);
    expect(noDocumentCandidate?.fullPledges).toEqual([]);
    expect(dataset.source.mode).toBe("nec");
  });

  it("uses candidate disclosure as an official fallback source when pledge PDFs are absent", () => {
    const dataset = buildResidenceDatasetFromNec({
      residence: suwonResidence,
      generatedAt: "2026-05-26T13:30:00+09:00",
      downloads: new Map(),
      candidateInfo: createCandidateInfoIndex([
        candidateInfoRecord({
          candidateId: "400",
          districtName: "수원시제1선거구",
          name: "광역후보",
          occupation: "경기도의회의원",
        }),
        candidateInfoRecord({
          candidateId: "500",
          districtName: "수원시나선거구",
          name: "기초후보",
          occupation: "수원시의회의원",
        }),
      ]),
      candidates: [
        necRow({ id: "governor", raceTypeCode: "3", raceName: "시·도지사선거", districtName: "경기도", name: "도지사후보" }),
        necRow({ id: "education", raceTypeCode: "11", raceName: "교육감선거", districtName: "경기도", name: "교육감후보" }),
        necRow({ id: "head", raceTypeCode: "4", raceName: "구·시·군의 장선거", districtName: "수원시", name: "시장후보" }),
        necRow({
          id: "city-council",
          raceTypeCode: "5",
          raceName: "시·도의회의원선거",
          districtName: "수원시제1선거구",
          candidateId: "400",
          name: "광역후보",
          fivePledgePdf: null,
          campaignBulletinPdf: null,
        }),
        necRow({
          id: "local-council",
          raceTypeCode: "6",
          raceName: "구·시·군의회의원선거",
          districtName: "수원시나선거구",
          candidateId: "500",
          name: "기초후보",
          fivePledgePdf: null,
          campaignBulletinPdf: null,
        }),
      ],
    });

    const priorityCandidate = dataset.candidates.find((candidate) => candidate.name === "광역후보");
    const lowerCandidate = dataset.candidates.find((candidate) => candidate.name === "기초후보");

    expect(priorityCandidate?.cache.policyPdf).toContain("info.nec.go.kr");
    expect(priorityCandidate?.publicRecord).toContain("후보자 정보공개 원문 있음");
    expect(priorityCandidate?.focusTags).toContain("후보자 정보공개");
    expect(priorityCandidate?.candidateTraits).toContain("근거 자료: 후보자 정보공개");
    expect(priorityCandidate?.comparison).toContain("후보자 정보공개 원문");
    expect(priorityCandidate?.cache.policyPdf).not.toBe("NEC row metadata only");
    expect(lowerCandidate?.cache.policyPdf).toContain("info.nec.go.kr");
    expect(lowerCandidate?.publicRecord).toContain("후보자 정보공개 원문 있음");
    expect(lowerCandidate?.focusTags).toContain("후보자 정보공개");
  });

  it("uses election scope embedded in generated nationwide residences", () => {
    const dataset = buildResidenceDatasetFromNec({
      residence: busanResidence,
      generatedAt: "2026-05-26T13:30:00+09:00",
      downloads: new Map(),
      candidates: [
        necRow({ id: "busan-mayor", raceTypeCode: "3", raceName: "시·도지사선거", districtName: "부산광역시", name: "김부산" }),
        necRow({ id: "busan-education", raceTypeCode: "11", raceName: "교육감선거", districtName: "부산광역시", name: "박교육" }),
        necRow({ id: "busan-head", raceTypeCode: "4", raceName: "구·시·군의 장선거", districtName: "중구", name: "최중구" }),
        necRow({ id: "busan-city-council", raceTypeCode: "5", raceName: "시·도의회의원선거", districtName: "중구선거구", name: "이광역" }),
        necRow({ id: "busan-local-council", raceTypeCode: "6", raceName: "구·시·군의회의원선거", districtName: "중구가선거구", name: "오기초" }),
        necRow({ id: "busan-metro-prop", raceTypeCode: "8", raceName: "광역의원비례대표선거", districtName: "부산광역시", name: "", partyName: "국민의힘" }),
        necRow({ id: "busan-local-prop", raceTypeCode: "9", raceName: "기초의원비례대표선거", districtName: "중구", name: "", partyName: "더불어민주당" }),
        necRow({ id: "other-city-council", raceTypeCode: "5", raceName: "시·도의회의원선거", districtName: "서구제1선거구", name: "제외" }),
      ],
    });

    expect(dataset.candidates.map((candidate) => candidate.office)).toEqual([
      "부산광역시장",
      "부산광역시교육감",
      "중구청장",
      "부산시의원 중구선거구",
      "중구의원 중구가선거구",
      "부산시의원 비례대표",
      "중구의원 비례대표",
    ]);
    expect(dataset.candidates.map((candidate) => candidate.name)).not.toContain("제외");
  });

  it("labels district-head ballots from election scope, not display district text", () => {
    const dataset = buildResidenceDatasetFromNec({
      residence: suwonResidence,
      generatedAt: "2026-05-26T13:30:00+09:00",
      downloads: new Map(),
      candidates: [
        necRow({ id: "suwon-head", raceTypeCode: "4", raceName: "구·시·군의 장선거", districtName: "수원시", name: "수원후보" }),
        necRow({ id: "suwon-local", raceTypeCode: "6", raceName: "구·시·군의회의원선거", districtName: "수원시나선거구", name: "기초후보" }),
      ],
    });

    expect(dataset.candidates.map((candidate) => candidate.office)).toEqual([
      "수원시장",
      "수원시의원 수원시나선거구",
    ]);
  });

  it("shows an extracted campaign bulletin fallback when pledge parsing finds no structured items", () => {
    const downloads: NecDownloadIndex = new Map([
      [
        "bulletin-only",
        {
          textPath: "data/nec/full/bulletin-texts/sample.txt",
          sourceType: "campaignBulletin",
          sourceLabel: "선거공보",
          pledgeTitles: [],
          pledges: [],
          policyTags: [],
        },
      ],
    ]);
    const dataset = buildResidenceDatasetFromNec({
      residence: suwonResidence,
      generatedAt: "2026-05-26T13:30:00+09:00",
      downloads,
      candidates: [
        necRow({
          id: "bulletin-only",
          raceTypeCode: "6",
          raceName: "구·시·군의회의원선거",
          districtName: "수원시나선거구",
          name: "공보후보",
          fivePledgePdf: null,
          campaignBulletinPdf: {
            requestedFileName: "공보후보_선거공보.pdf",
            requestedFullPath: "20260603/PDF/PBINFO/4101/003_100_20260520_1.pdf",
            downloadUrl: "https://policy.nec.go.kr/bulletin.pdf",
          },
        }),
      ],
    });

    const candidate = dataset.candidates[0];

    expect(candidate.pledgeSummary).toBe("");
    expect(candidate.pledgeHighlights).toEqual(["선거공보"]);
    expect(candidate.pledgeHighlights.join(" ")).not.toContain("대기");
    expect(candidate.fullPledges).toEqual([]);
  });

  it("compares differentiators only within the same local electoral district", () => {
    const downloads: NecDownloadIndex = new Map([
      [
        "local-a",
        {
          textPath: "data/nec/full/pdfs/local-a.txt",
          pledgeTitles: ["교통 개선", "청년 주거"],
          pledges: [
            { title: "교통 개선", detail: "마을버스 노선을 조정합니다." },
            { title: "청년 주거", detail: "청년 주거 상담을 확대합니다." },
          ],
          policyTags: ["교통", "주거"],
        },
      ],
      [
        "local-b",
        {
          textPath: "data/nec/full/pdfs/local-b.txt",
          pledgeTitles: ["교통 안전"],
          pledges: [{ title: "교통 안전", detail: "보행 안전 시설을 늘립니다." }],
          policyTags: ["교통"],
        },
      ],
      [
        "other-local",
        {
          textPath: "data/nec/full/pdfs/other-local.txt",
          pledgeTitles: ["주거 지원"],
          pledges: [{ title: "주거 지원", detail: "다른 선거구 주거 공약입니다." }],
          policyTags: ["주거"],
        },
      ],
    ]);
    const dataset = buildResidenceDatasetFromNec({
      residence: suwonResidence,
      generatedAt: "2026-05-26T13:30:00+09:00",
      downloads,
      candidates: [
        necRow({
          id: "local-a",
          raceTypeCode: "6",
          raceName: "구·시·군의회의원선거",
          districtName: "수원시나선거구",
          name: "나후보",
          candidateNumber: "1",
        }),
        necRow({
          id: "local-b",
          raceTypeCode: "6",
          raceName: "구·시·군의회의원선거",
          districtName: "수원시나선거구",
          name: "다후보",
          candidateNumber: "2",
        }),
        necRow({
          id: "other-local",
          raceTypeCode: "6",
          raceName: "구·시·군의회의원선거",
          districtName: "수원시다선거구",
          name: "다른선거구",
          candidateNumber: "3",
        }),
      ],
    });

    const candidate = dataset.candidates.find((item) => item.name === "나후보");

    expect(dataset.candidates.map((item) => item.name)).not.toContain("다른선거구");
    expect(candidate?.comparisonDetails[0]).toContain("눈여겨볼 차이");
    expect(candidate?.comparisonDetails[0]).toContain("주거");
    expect(candidate?.comparisonDetails.join(" ")).not.toContain("공통 경쟁 분야");
    expect(candidate?.comparisonDetails.join(" ")).not.toContain("비교 범위");
    expect(candidate?.comparisonDetails.join(" ")).not.toContain("수원시다선거구");
  });
});
