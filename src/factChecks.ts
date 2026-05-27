import type { Candidate, RaceType } from "./electionTypes";

export type FactCheckTone = "verified" | "caution" | "unknown";

export type FactCheckItem = {
  claim: string;
  verdict: "공식 사업 확인" | "권한 확인 필요" | "재원 확인 필요" | "판단 보류";
  check: string;
  sources: Array<{
    name: string;
    url: string;
  }>;
};

export type FactCheckReview = {
  summary: string;
  tone: FactCheckTone;
  items: FactCheckItem[];
};

const necSource = {
  name: "중앙선거관리위원회 정책공약마당",
  url: "https://policy.nec.go.kr/",
};

const localAutonomyLawSource = {
  name: "국가법령정보센터 지방자치법",
  url: "https://www.law.go.kr/LSW/lsInfoP.do?lsId=001656",
};

const seoulRailSource = {
  name: "서울시 제2차 도시철도망 구축계획",
  url: "https://opengov.seoul.go.kr/policy/24760843",
};

const seoulRailAnnouncementSource = {
  name: "서울시 도시철도망 구축계획 발표",
  url: "https://news.seoul.go.kr/traffic/archives/500890",
};

const thirdNewTownSource = {
  name: "국토교통부 3기 신도시 추진 현황",
  url: "https://www.molit.go.kr/policy/capital/cap_e_03.jsp",
};

const yonginSemiconductorSource = {
  name: "정책브리핑 용인 반도체 국가산단 승인",
  url: "https://www.korea.kr/news/policyNewsView.do?newsId=148937933",
};

const yonginCooperationSource = {
  name: "정책브리핑 용인 국가산단 상생협약",
  url: "https://www.korea.kr/news/policyNewsView.do?newsId=148928254",
};

const gtxPlanningSource = {
  name: "국토교통부 2026 업무계획",
  url: "https://www.molit.go.kr/2026plan/sub5_public.html",
};

const nationalFinanceActSource = {
  name: "국가법령정보센터 국가재정법 제38조",
  url: "https://www.law.go.kr/LSW/lsLawLinkInfo.do?chrClsCd=010202&lsJoLnkSeq=1000262526",
};

const localEducationAutonomyLawSource = {
  name: "국가법령정보센터 지방교육자치에 관한 법률",
  url:
    "https://www.law.go.kr/LSW/LsiJoLinkP.do?docType=&joNo=&languageType=KO&lsNm=%EC%A7%80%EB%B0%A9%EA%B5%90%EC%9C%A1%EC%9E%90%EC%B9%98%EC%97%90+%EA%B4%80%ED%95%9C+%EB%B2%95%EB%A5%A0&paras=1",
};

const localEducationFinanceSource = {
  name: "국가법령정보센터 지방교육재정교부금법",
  url: "https://www.law.go.kr/LSW/lsInfoP.do?chrClsCd=010202&lsId=000880&lsiSeq=273395&urlMode=lsInfoP",
};

const elementarySecondaryEducationLawSource = {
  name: "국가법령정보센터 초·중등교육법 제23조",
  url:
    "https://www.law.go.kr/LSW/lsSideInfoP.do?docCls=jo&joBrNo=00&joNo=0023&lsiSeq=279605&urlMode=lsScJoRltInfoR",
};

const factChecks: Record<string, FactCheckReview> = {
  "20260603-320260603-100157144": {
    summary: "서울 철도망·돌봄 공약은 공식 계획 또는 지방정부 사무와 맞닿지만, 장기 철도·재원은 후속 절차 확인이 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "강북횡단선·서부선 등 격자형 철도망과 통근시간 단축",
        verdict: "공식 사업 확인",
        check:
          "서울시 제2차 도시철도망 구축계획에는 강북횡단선, 서부선, 목동선 등 노선이 포함됩니다. 다만 도시철도망은 장기계획이므로 착공·개통 시점은 예비타당성, 국토교통부 협의, 재원 조달을 따로 확인해야 합니다.",
        sources: [necSource, seoulRailSource, seoulRailAnnouncementSource],
      },
      {
        claim: "초등 돌봄·긴급 돌봄 확대",
        verdict: "권한 확인 필요",
        check:
          "아동·청소년 복지와 생활 지원은 지방자치단체 사무 범위와 연결됩니다. 실제 확대 범위는 조례, 예산, 교육청·자치구 협력 여부를 확인해야 합니다.",
        sources: [necSource, localAutonomyLawSource],
      },
    ],
  },
  "20260603-320260603-100162984": {
    summary: "주택공급·교통·돌봄 공약은 지방정부와 국가 계획이 함께 움직이는 영역이어서 재원과 협의 구조가 핵심입니다.",
    tone: "caution",
    items: [
      {
        claim: "주택공급과 교통 인프라 확대",
        verdict: "재원 확인 필요",
        check:
          "주거·교통 관련 사무는 지방정부 정책 영역과 연결되지만, 대규모 공공주택·도시철도·도로망 투자는 국고, 기금, 공공기여, 민자 등 재원 구조가 확인되어야 합니다.",
        sources: [necSource, localAutonomyLawSource, seoulRailSource],
      },
      {
        claim: "초등돌봄·교육 지원 확대",
        verdict: "권한 확인 필요",
        check:
          "돌봄시설 확충은 지방정부 예산·조례와 연결될 수 있으나, 학교·교육 프로그램과 결합되는 항목은 교육청 협의와 운영 인력 확보가 필요합니다.",
        sources: [necSource, localAutonomyLawSource],
      },
    ],
  },
  "20260603-320260603-100158541": {
    summary: "AI 행정·복지 자동연결은 지방정부 행정혁신 범위에서 검토 가능하지만, 개인정보·오류구제·계약 절차를 보수적으로 봐야 합니다.",
    tone: "caution",
    items: [
      {
        claim: "AI 행정 포털과 인허가 자동화",
        verdict: "권한 확인 필요",
        check:
          "지방자치단체는 자치사무와 법령상 위임사무를 처리할 수 있으나, AI 인허가·복지 자동연결은 개인정보 처리, 이의제기, 감사·계약 절차를 별도 제도로 설계해야 합니다.",
        sources: [necSource, localAutonomyLawSource],
      },
    ],
  },
  "20260603-320260603-100162632": {
    summary: "여성 안전·건강·주거 지원은 지방 복지 정책으로 검토 가능하지만, 수사·처벌과 학교 운영은 다른 기관 권한이 함께 걸립니다.",
    tone: "caution",
    items: [
      {
        claim: "여성폭력 예방, 피해자 지원, 여성 건강·주거 정책",
        verdict: "권한 확인 필요",
        check:
          "복지·보건·주거 지원은 지방정부 사무와 연결될 수 있습니다. 다만 성범죄 수사·처벌, 학교 교육과정, 의료기관 확충은 국가 법령과 교육청·보건당국 협력이 필요합니다.",
        sources: [necSource, localAutonomyLawSource],
      },
    ],
  },
  "20260603-320260603-100162642": {
    summary: "복지 배정 원칙과 조례 개정 공약은 상위 법령과 권리 제한 여부를 먼저 확인해야 합니다.",
    tone: "caution",
    items: [
      {
        claim: "자국민 우선 복지 배정, 조례 제·개정, 공공질서 대응",
        verdict: "권한 확인 필요",
        check:
          "지방자치단체 조례는 법령의 범위에서 그 사무에 관해 정할 수 있습니다. 권리 제한, 의무 부과, 차별 소지가 있는 배정 기준은 법률 위임과 상위 법령 적합성 확인이 필요합니다.",
        sources: [necSource, localAutonomyLawSource],
      },
    ],
  },
  "20260603-320260603-100162720": {
    summary: "공공돌봄·교통·의료 확대는 지방정부 정책과 연결되지만, 노동권·최저보수·대규모 무상화는 법률과 재원 확인이 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "대중교통 무상화, 공공의료·공공돌봄 확대",
        verdict: "재원 확인 필요",
        check:
          "복지·보건·교통 편의는 지방정책으로 검토할 수 있으나, 무상화와 공공서비스 확대는 연간 재원·인력·시설 확보가 먼저 검증되어야 합니다.",
        sources: [necSource, localAutonomyLawSource],
      },
      {
        claim: "플랫폼 최저보수, 노동감독권 강화",
        verdict: "권한 확인 필요",
        check:
          "노동권 보호 조례나 공공조달 기준은 검토 가능하나, 근로기준법상 감독·최저보수 제도는 국가 법령과 권한 이양 범위를 확인해야 합니다.",
        sources: [necSource, localAutonomyLawSource],
      },
    ],
  },
  "20260603-320260603-100163148": {
    summary: "GTX·3기 신도시·공공돌봄은 공식 사업 또는 지방 사무와 연결되지만, 광역철도 개통은 경기도 단독으로 보장하기 어렵습니다.",
    tone: "caution",
    items: [
      {
        claim: "GTX 추진, 수도권 30분 출근, 3기 신도시·역세권 주거",
        verdict: "공식 사업 확인",
        check:
          "GTX와 3기 신도시는 국가·광역 단위 공식 사업과 연결됩니다. 다만 노선 착공·개통, 예비타당성, 사업시행자 협약, 재원 분담은 국토교통부·기재부·시군·민간사업자 절차가 필요해 도 단독 보장은 불가합니다.",
        sources: [necSource, gtxPlanningSource, thirdNewTownSource],
      },
      {
        claim: "공공요양원, 돌봄 SOC, 무장애 관광",
        verdict: "권한 확인 필요",
        check:
          "노인·장애인 복지와 관광 편의는 지방정부 사무와 연결됩니다. 실제 적용 범위는 시군 배치, 인력, 예산, 조례가 확인되어야 합니다.",
        sources: [necSource, localAutonomyLawSource],
      },
    ],
  },
  "20260603-320260603-100163432": {
    summary: "용인 반도체 국가산단은 공식 승인된 국가사업이지만, 경기도 공약의 GRDP·일자리 효과는 별도 산식과 협약 확인이 필요합니다.",
    tone: "verified",
    items: [
      {
        claim: "용인 반도체 국가산단과 AI·반도체 클러스터 성장",
        verdict: "공식 사업 확인",
        check:
          "용인 반도체 국가산단은 국토교통부가 산업단지계획 승인과 국가산단 지정을 발표한 공식 사업입니다. 다만 GRDP 1억원, 고용 효과, 교육·교통 확산 효과는 후보 공약의 정책목표이므로 별도 산식과 연차 계획 확인이 필요합니다.",
        sources: [necSource, yonginSemiconductorSource, yonginCooperationSource],
      },
    ],
  },
  "20260603-320260603-100163471": {
    summary: "전세·신도시·교통 대응은 경기도 정책 영역과 맞지만, 공항·광역철도·규제프리존은 중앙정부 절차가 큽니다.",
    tone: "caution",
    items: [
      {
        claim: "전세대란 대응, 1기 신도시 재정비, GTX·광역교통 대응",
        verdict: "권한 확인 필요",
        check:
          "주거·교통 행정지원은 도 정책으로 검토 가능하지만, 1기·3기 신도시, GTX, 공항, 규제프리존은 국가계획·인허가·예비타당성·법령 개정과 맞물립니다.",
        sources: [necSource, thirdNewTownSource, gtxPlanningSource, localAutonomyLawSource],
      },
    ],
  },
  "20260603-320260603-100153796": {
    summary: "돌봄·노동·공공금융 공약은 지방 복지와 조직권에 닿지만, 금융업·노동감독·세제는 법률 검토가 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "노동부지사, 공공통합돌봄, 경기공공은행",
        verdict: "권한 확인 필요",
        check:
          "지방정부 조직과 복지사업은 조례·예산으로 검토할 수 있습니다. 다만 공공은행 설립, 금융업 인가, 노동감독권, 새로운 세원은 법률·중앙정부 권한과 충돌하지 않는지 확인해야 합니다.",
        sources: [necSource, localAutonomyLawSource],
      },
    ],
  },
  "20260603-320260603-100158402": {
    summary: "국민발의·행정구역 통폐합·무상의료 같은 대형 제도개편은 도지사 단독 실행보다 법률·국회·지방의회 절차가 핵심입니다.",
    tone: "unknown",
    items: [
      {
        claim: "국민발의제도, 행정계층·행정구역 통폐합, 무상의료·무상주택",
        verdict: "권한 확인 필요",
        check:
          "지방 행정구역 조정은 지방정부 의견과 절차가 관련되지만, 광역 통폐합, 국민발의, 무상의료·무상주택의 전국적 제도화는 국회·법률·지방의회·중앙정부 재정 절차가 필요합니다.",
        sources: [necSource, localAutonomyLawSource],
      },
    ],
  },
  "20260603-1120260603-100153800": {
    summary:
      "교육과정 자율, 학교 선택권, 무상통학·에듀패스 공약은 교육감 권한과 맞닿지만 국가 교육과정·교원·재원 절차 확인이 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "교육과정·교원·학교 자율 혁신, 학교 선택권 확대",
        verdict: "권한 확인 필요",
        check:
          "교육감은 지역 교육·학예 사무를 맡지만, 국가교육과정 정비, 교원 양성·선발 체제, 대학입시·등록금 자율화는 교육부·대학·법령 절차와 함께 봐야 합니다.",
        sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource],
      },
      {
        claim: "무상통학카드, 에듀패스, 무상영어교육 등 교육복지 브랜드",
        verdict: "재원 확인 필요",
        check:
          "교육복지 확대는 교육청 예산으로 검토할 수 있으나, 반복 지출 사업은 교육비특별회계, 지방교육재정교부금, 서울시 협력 재원의 연차별 규모 확인이 필요합니다.",
        sources: [necSource, localEducationFinanceSource],
      },
    ],
  },
  "20260603-1120260603-100155563": {
    summary:
      "AI 교육, 청소년 자산, 교과전담교사 확대는 교육청 사업으로 설계 가능하지만 교원 정원·인건비와 서울시 분담이 핵심입니다.",
    tone: "caution",
    items: [
      {
        claim: "AI 교육 플랫폼과 초등 교과전담교사 전면 확대",
        verdict: "권한 확인 필요",
        check:
          "교육청은 학교 교육과 정보화 사업을 추진할 수 있으나, 교과전담교사 신설·정원 확충·표준수업시수 법제화는 교육부 협의와 교원 수급 계획을 확인해야 합니다.",
        sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource],
      },
      {
        claim: "서울 청소년 미래자산 펀드와 대규모 AI·인력 예산",
        verdict: "재원 확인 필요",
        check:
          "후보 공약은 교육청·서울시 분담을 전제로 합니다. 실제 집행은 조례, 교육비특별회계 예산, 서울시 협력 예산, 지방교육재정교부금 사용 가능 범위를 확인해야 합니다.",
        sources: [necSource, localEducationFinanceSource],
      },
    ],
  },
  "20260603-1120260603-100163258": {
    summary:
      "AI 학력진단, 무상급식·돌봄, 학교시설 현대화 공약은 추진 가능성이 있으나 개인정보·인력·시설재원 확인이 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "AI 학력평가, AI 진로진학, 안면인식 CCTV 등 AI 기반 학교 운영",
        verdict: "권한 확인 필요",
        check:
          "AI 학습지원과 학교 안전 시스템은 교육청 정보화 사업으로 검토할 수 있지만, 학생 데이터 처리, 학교별 운영 기준, 장비 도입·유지관리 예산을 분리해 확인해야 합니다.",
        sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource],
      },
      {
        claim: "특수교사 증원, 특수교육 시설 확충, 노후학교 스마트스쿨 리모델링",
        verdict: "재원 확인 필요",
        check:
          "특수교육·시설 개선은 교육청 책무와 연결되지만 교원 증원, 시설 공사, 지방자치단체 대응투자는 정원·예산·중장기 시설계획 확인이 필요합니다.",
        sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource],
      },
    ],
  },
  "20260603-1120260603-100162651": {
    summary: "단일 학군제, 학원 총량제, 교원 확충·연구년 확대는 법령·조례·중앙정부 협의 여부를 먼저 봐야 합니다.",
    tone: "caution",
    items: [
      {
        claim: "고등학교 서울 단일 학군제, 학교 선택 무제한, 공립특목고 전환",
        verdict: "권한 확인 필요",
        check:
          "고입 배정과 학교 운영은 교육청 권한과 연결되지만, 학교 유형 개편과 입학전형 변경은 관련 법령, 조례, 중앙정부 협의, 학교 현장 수용성을 함께 확인해야 합니다.",
        sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource],
      },
      {
        claim: "담임 수업시수 감축, 교원 임용 확대, 유급 연구년제 확대",
        verdict: "재원 확인 필요",
        check:
          "교원 업무 경감은 교육청 정책으로 검토 가능하지만, 정규 교원 확충과 연구년 확대는 교원 정원, 대체 인력, 인건비 재원 계획이 필요합니다.",
        sources: [necSource, localEducationFinanceSource],
      },
    ],
  },
  "20260603-1120260603-100153774": {
    summary:
      "안전·돌봄·사교육 부담 완화 공약은 교육청과 지자체 협력 영역이지만 영유아·졸업 후 지원까지 확대되는 범위는 권한과 재원을 나눠 확인해야 합니다.",
    tone: "caution",
    items: [
      {
        claim: "0세부터 초등취학까지 교육청 돌봄 책임, 온종일·24시간 응급 돌봄",
        verdict: "권한 확인 필요",
        check:
          "학교 돌봄과 유치원 지원은 교육청 사무와 연결되지만, 영유아 보육·지자체 시설 활용·24시간 응급 돌봄은 서울시·자치구·복지 행정과의 협력 구조를 확인해야 합니다.",
        sources: [necSource, localEducationAutonomyLawSource],
      },
      {
        claim: "공립형 학원, 대학등록금·재수생 학원비 등 졸업 후 지원",
        verdict: "재원 확인 필요",
        check:
          "교육격차 완화 사업은 검토 가능하나, 학원비·등록금성 지원은 대상, 법적 근거, 교육비특별회계 사용 가능성, 반복 재원 규모 확인이 필요합니다.",
        sources: [necSource, localEducationFinanceSource],
      },
    ],
  },
  "20260603-1120260603-100161493": {
    summary:
      "무상교육, 기초학력, AI·돌봄 공약은 교육청 사무와 맞지만 유아·교통비·인력 확대는 국비와 서울시 협력이 중요합니다.",
    tone: "caution",
    items: [
      {
        claim: "유아교육비·급식비·방과후·돌봄비 무상화와 등하교 교통비 지원",
        verdict: "재원 확인 필요",
        check:
          "무상교육·교육복지는 교육청 정책으로 검토할 수 있으나, 유아 단계와 교통비 전액 지원은 국비, 서울시·자치구 협력 예산, 지방교육재정 안정성을 함께 확인해야 합니다.",
        sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource],
      },
      {
        claim: "기초학력 전문 교사, AI 에듀테크 전담 인력, 돌봄 강사풀 확대",
        verdict: "권한 확인 필요",
        check:
          "학습지원·방과후·돌봄 운영은 교육청 권한과 연결됩니다. 다만 모든 학교 배치나 대규모 전담 인력 선발은 정원, 고용 형태, 인건비, 지자체 협력 여부가 필요합니다.",
        sources: [necSource, elementarySecondaryEducationLawSource, localEducationFinanceSource],
      },
    ],
  },
  "20260603-1120260603-100153778": {
    summary:
      "교육행정·교육과정 혁신은 교육청 권한 안에서 검토 가능하지만 무상교통과 입시제도 개선은 서울시·교육부 협력이 필수입니다.",
    tone: "caution",
    items: [
      {
        claim: "교육과정·평가 혁신, AI윤리·디지털문해력 교육",
        verdict: "권한 확인 필요",
        check:
          "교육감은 지역 교육과정 운영과 교원 연수 지원을 추진할 수 있으나, 교육과정은 국가 기준 범위 안에서 운영됩니다. 평가 방식 확대도 학교 현장 기준과 교육부 지침을 확인해야 합니다.",
        sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource],
      },
      {
        claim: "아동·청소년 무상교통과 대학입시제도 개선 TF",
        verdict: "권한 확인 필요",
        check:
          "무상교통은 서울시·자치구 공동재정과 교통 행정 협력이 필요하고, 대학입시제도 개선은 교육청 단독 결정이 아니라 교육부·시도교육감협의회 등 국가 차원의 절차가 필요합니다.",
        sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource],
      },
    ],
  },
  "20260603-1120260603-100153786": {
    summary:
      "0~12세 책임교육, 고교체계 개편, AI·평생학습 공약은 교육청 사무와 관련되지만 보육·학교유형·교육화폐는 협력과 재원 검증이 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "0~12세 통합 책임교육, 돌봄 대기자 제로, 드림스타트 연계",
        verdict: "권한 확인 필요",
        check:
          "초등 돌봄과 기초학력 지원은 교육청 사무와 연결되지만, 보육·드림스타트·자치구 공동운영은 복지 행정과 지방자치단체 협력 체계를 확인해야 합니다.",
        sources: [necSource, localEducationAutonomyLawSource],
      },
      {
        claim: "중·고교 체계 개편, AI 미래교실, 청소년 연 100만 원 교육화폐",
        verdict: "재원 확인 필요",
        check:
          "학교 교육과 디지털 교육은 교육청이 추진할 수 있으나, 학교유형·고입 절차 개편은 국가 기준과 협의가 필요합니다. 교육화폐와 AI 인프라는 연차별 교육재정 확보가 핵심입니다.",
        sources: [necSource, elementarySecondaryEducationLawSource, localEducationFinanceSource],
      },
    ],
  },
  "20260603-1120260603-100163064": {
    summary:
      "기초학력·AI 학습·특수학교·교권보호 공약은 교육감 사무와 연결되지만, 교육과정 기준, 학교 설립, 인력과 교육재정 확인이 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "기초학력 보장, AI 맞춤형 학습플랫폼, 과학고·체육고 설립",
        verdict: "권한 확인 필요",
        check:
          "교육감은 지역 교육·학예 사무를 맡지만, 교육과정은 국가 기준의 범위 안에서 운영됩니다. AI 플랫폼 확대와 특성화 학교 설립은 학교 설립 절차, 교원 배치, 지자체 부지·재정 협력 여부를 함께 확인해야 합니다.",
        sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource],
      },
      {
        claim: "교복·일상복 지원, 교권보호 시스템, 특수·다문화·영유아 지원 확대",
        verdict: "재원 확인 필요",
        check:
          "교육비 지원, 상담·법률·심리 인력, 특수교육·다문화 지원은 교육비특별회계와 지방교육재정교부금, 국비·지자체 협력 재원에 따라 지속 가능성이 달라집니다. 현금성 지원과 전문인력 확충은 연차별 예산과 운영 인력 계획 확인이 필요합니다.",
        sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource],
      },
    ],
  },
  "20260603-1120260603-100153797": {
    summary:
      "AI 교육체제·교권·무상통학·교육자치 공약은 교육청 권한과 맞닿지만, 법률 개정, 지자체 협력, 반복 재원 구조를 나눠 확인해야 합니다.",
    tone: "caution",
    items: [
      {
        claim: "AI 교육체제, 교육과정·평가 변화, AI·반도체 고교 전환·신설",
        verdict: "권한 확인 필요",
        check:
          "교육감은 지역 교육과 학교 운영을 추진할 수 있으나, 교육과정과 평가 운영은 국가 기준의 범위 안에서 정해집니다. 고교 전환·신설과 권역별 교육환경 조성은 학교 설립, 교원 수급, 지자체 협력 절차를 확인해야 합니다.",
        sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource],
      },
      {
        claim: "교사 정치기본권·면책권 제도화, 교직수당 인상, 교권119",
        verdict: "권한 확인 필요",
        check:
          "교권보호센터나 민원 대응 체계는 교육청 사업으로 검토할 수 있지만, 교사의 정치기본권·면책권 제도화와 교직수당 인상은 법률·중앙부처·국회 협의가 필요한 영역입니다. 교육감 단독 실행 항목과 입법 건의 항목을 구분해 봐야 합니다.",
        sources: [necSource, localEducationAutonomyLawSource],
      },
      {
        claim: "무상통학, 씨앗교육펀드, 온동네 돌봄, 학교복합시설 확대",
        verdict: "재원 확인 필요",
        check:
          "통학 지원, 돌봄, 학생 지원금, 학교시설 개방·복합화는 교육청과 지방자치단체 협력이 핵심입니다. 반복 지출과 시설 운영비가 큰 공약이므로 교육비특별회계, 지자체 대응투자, 인력·유지관리 계획을 확인해야 합니다.",
        sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource],
      },
    ],
  },
};

const raceCategoryFactChecks: Partial<Record<RaceType, FactCheckReview>> = {
  광역단체장: {
    summary:
      "광역단체장 공약은 지방정부 사무와 국가사업 협의가 섞입니다. 대형 인프라·현금성 지원은 권한, 예산, 중앙정부 절차를 함께 확인해야 합니다.",
    tone: "caution",
    items: [
      {
        claim: "철도·공항·항만·산업단지·대형 개발 같은 광역 인프라",
        verdict: "권한 확인 필요",
        check:
          "시·도는 지역 계획과 행정 집행을 맡을 수 있지만, 대규모 건설·교통·산업 사업은 국가계획 반영, 인허가, 예비타당성조사, 중앙부처·기초단체 협의가 함께 필요할 수 있습니다. 후보 공약은 단독 확정이 아니라 추진 권한과 협의 구조를 나눠 봐야 합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
      {
        claim: "청년·돌봄·복지·지역화폐·현금성 지원 확대",
        verdict: "재원 확인 필요",
        check:
          "주민 복지와 지역경제 지원은 지방정부 정책 영역과 연결되지만, 반복 지출 사업은 조례, 지방의회 예산 심의, 국비·시도비·기금 매칭, 대상자 기준이 확인되어야 합니다.",
        sources: [necSource, localAutonomyLawSource],
      },
    ],
  },
  교육감: {
    summary:
      "교육감 공약은 교육·학예 사무 범위에서 검토하되, 교육과정·교원·학교시설·돌봄·무상지원은 국가 기준과 교육재정 절차를 함께 확인해야 합니다.",
    tone: "caution",
    items: [
      {
        claim: "학력 강화, AI·디지털 교육, 학교 운영·돌봄 확대",
        verdict: "권한 확인 필요",
        check:
          "교육감은 지역 교육·학예 사무를 맡지만, 교육과정은 국가 기준의 범위 안에서 정해집니다. 학교 신설·이전, 돌봄 운영, 인력 배치는 법령·교육청 예산·지자체 협력 여부를 나눠 봐야 합니다.",
        sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource],
      },
      {
        claim: "무상지원, 시설 개선, AI 장비·플랫폼 도입",
        verdict: "재원 확인 필요",
        check:
          "교육복지와 시설·장비 투자는 교육비특별회계, 지방교육재정교부금, 국비 공모, 지방자치단체 협력 재원에 따라 집행 가능성이 달라집니다. 연차별 예산, 조달 방식, 유지비와 인력 계획 확인이 필요합니다.",
        sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource],
      },
    ],
  },
};

type FactCheckTarget = string | Pick<Candidate, "id" | "race">;

export function getCandidateFactCheck(target: FactCheckTarget) {
  const candidateId = typeof target === "string" ? target : target.id;
  const candidateSpecificFactCheck = factChecks[candidateId];

  if (candidateSpecificFactCheck) {
    return candidateSpecificFactCheck;
  }

  const race = typeof target === "string" ? undefined : target.race;

  return race ? raceCategoryFactChecks[race] : undefined;
}
