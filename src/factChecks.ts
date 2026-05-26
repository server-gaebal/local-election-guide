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
};

export function getCandidateFactCheck(candidateId: string) {
  return factChecks[candidateId];
}
