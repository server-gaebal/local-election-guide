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
  "20260603-320260603-100163198": {
    summary:
      "신산업·균형발전·기본사회 공약은 통합특별시 정책 방향과 맞닿지만, 광역 SOC와 기본소득성 사업은 국비·조례·재원 구조 확인이 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "권역별 신산업벨트, 10-30-60 교통체계, 기본사회 확대",
        verdict: "재원 확인 필요",
        check:
          "산업육성·복지·교통 편의는 지방정부 사무와 연결됩니다. 다만 전략산업 실행기관, 광역 BRT·철도, 해상교통 공영제, 기본소득성 배당은 중앙정부 협의와 연차별 재원계획을 따로 확인해야 합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100163089": {
    summary: "대기업 유치·청년도시·에너지산단 공약은 투자유치 전략이지만, 세제 감면과 특별지원은 법령·중앙정부 권한이 큽니다.",
    tone: "caution",
    items: [
      {
        claim: "대기업 10개 유치, 청년혁신예산, 발전설비 산업단지",
        verdict: "권한 확인 필요",
        check:
          "기업유치 전담조직과 지역 산업지원은 지방정부가 추진할 수 있습니다. 법인세 감면, 대통령 직속 지원체계, 국가전략특구, 연 20조 투자유치는 법률·중앙정부 결정·민간투자 확약 여부 확인이 필요합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100153775": {
    summary:
      "호남대통합·20조 시민배당·신생아 1억 펀드는 대형 제도·재정 공약으로, 광역단체장 단독 실행 범위를 넘는 절차가 많습니다.",
    tone: "unknown",
    items: [
      {
        claim: "호남대통합, 20조 시민배당, 신생아 1억 미래펀드",
        verdict: "권한 확인 필요",
        check:
          "광역 행정통합은 지방정부 협의만으로 완료되지 않고 법률·지방의회·주민 의견 절차가 필요합니다. 20조 특별교부금 활용, 10조 창업기금, 신생아 1억 보장은 재원 확정과 운용수익 가정 검증이 필요합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100159061": {
    summary:
      "노동·돌봄·지역금융·탄소중립 공약은 조례와 기금으로 일부 추진 가능하지만, 금융·철도·의료 인프라는 인허가와 재원이 관건입니다.",
    tone: "caution",
    items: [
      {
        claim: "모두의노동기금, 지역공공은행, RE100 경제, 무상교통",
        verdict: "권한 확인 필요",
        check:
          "지방정부는 조례와 기금으로 노동·돌봄·탄소중립 사업을 설계할 수 있습니다. 지역공공은행 설립, 500병상 병원, 광역철도망, 무상교통은 금융 인가, 국가계획 반영, 국비·시비 부담 구조 확인이 필요합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100162728": {
    summary:
      "의료·유통·관광·농어촌 공약은 지방정책으로 검토 가능하지만, 대형 병원·테마파크·공공매입은 사업성·재원·민간협약 확인이 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "닥터헬기·병원선, 디즈니랜드 유치, 농수산물 공공매입·수출",
        verdict: "재원 확인 필요",
        check:
          "보건·지역경제·관광 지원은 지방정부 사무와 연결됩니다. 다만 대형병원 신축, 테마파크 유치, 택시 공영화, SPC 공공매입·수출 체계는 인허가, 운영주체, 국비·지방비 매칭 및 민간 참여 확약이 필요합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100163192": {
    summary:
      "해양수도·AI·트라이포트 공약은 부산의 산업 방향과 맞지만, 특별법·국가기관 이전·광역철도는 중앙정부 절차 의존도가 높습니다.",
    tone: "caution",
    items: [
      {
        claim: "해양수도 부산, K-해양 AI 벨트, 가덕신공항 연계 트라이포트",
        verdict: "권한 확인 필요",
        check:
          "산업 클러스터와 시 조직 개편은 지방정부가 추진할 수 있습니다. 해사전문법원, 해수부 산하기관 이전, UN AI 허브, TRX·신공항 접근망은 법률 제정, 국가계획, 예타·국비 절차 확인이 필요합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100162954": {
    summary: "청년자산·가덕신공항·AI·생활권 공약은 재원 산식과 국가사업 일정 검증이 핵심입니다.",
    tone: "caution",
    items: [
      {
        claim: "30세 1억 부산찬스, 가덕신공항·BuTX, AI 일자리 5만개",
        verdict: "재원 확인 필요",
        check:
          "청년·복지·AI 산업지원은 조례와 예산으로 일부 추진할 수 있습니다. 30년 수익률 기반 자산형성, 신공항 조기개항, BuTX, 산업은행 이전, 일자리 5만개는 법률·예타·민자·운용수익 가정 확인이 필요합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100155833": {
    summary: "기업유치·침례병원·콘텐츠 관광·돔구장 공약은 시 정책으로 검토 가능하지만 민간협약과 사업비 변경 리스크가 큽니다.",
    tone: "caution",
    items: [
      {
        claim: "부산 제로-백, 침례병원 재개원, 넷플릭스 하우스, 사직돔구장",
        verdict: "재원 확인 필요",
        check:
          "기업지원, 공공의료, 문화·체육시설은 지방정부 사무와 연결됩니다. 글로벌 콘텐츠 기업 유치, 500병상 병원 정상화, 개폐형 돔 전환은 민간 협약, 중앙투자심사, 운영수지와 추가 재원 확인이 필요합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100162026": {
    summary: "AI로봇·행정통합·신공항·교통 공약은 대구 전략과 맞지만, 통합특별법·공항 국비·철도 예타가 핵심 변수입니다.",
    tone: "caution",
    items: [
      {
        claim: "AI로봇 수도, 대구경북 행정통합·통합신공항, 10분 역세권",
        verdict: "권한 확인 필요",
        check:
          "산업지원과 대중교통·복지사업은 지방정부가 추진할 수 있습니다. 행정통합, 신공항 국가지원 전환, 광역철도·도시철도 확충은 법률, 주민투표 또는 의회 절차, 국가재정 절차 확인이 필요합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100163199": {
    summary: "반도체·창업·신공항 공약은 대규모 투자 유치형 공약으로, 국가사업 전환과 민간 투자 확약 확인이 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "반도체 산업단지, 창업성장펀드 1조원, TK신공항 국가사업 전환",
        verdict: "재원 확인 필요",
        check:
          "특화산단과 창업지원은 지방정부 정책으로 설계할 수 있습니다. 대기업 팹 유치, 신공항 전액 국비 전환, 1조원 펀드는 법 개정, 국가재정 편성, 민간·금융권 출자 확약을 확인해야 합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100156890": {
    summary: "도심공항 존치·군공항 국비 이전·청년펀드·상수원 전환은 중앙정부와 관계기관 협의가 전제입니다.",
    tone: "caution",
    items: [
      {
        claim: "대구공항 도심존치, 군공항 전액 국비 이전, 매년 1조 청년창업펀드",
        verdict: "권한 확인 필요",
        check:
          "조례 기반 펀드와 반려문화 인프라는 지방정부가 추진할 수 있습니다. 공항 존치·군공항 이전비 국비 부담, 후적지 무상양도, 영천댐 용수 전환은 법률 개정과 국방부·국토부·수자원공사 협의가 필요합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100163128": {
    summary: "신산업·원도심·광역교통 공약은 인천시 정책과 국가 철도계획이 함께 움직이는 영역입니다.",
    tone: "caution",
    items: [
      {
        claim: "ABC+E 신산업, 제문부 프로젝트, GTX-B·D·E와 격자형 철도망",
        verdict: "권한 확인 필요",
        check:
          "산업육성, 원도심 개발, 복지·돌봄은 지방정부 사무와 연결됩니다. GTX와 도시철도 신설, 공공의료복지타운, 해상풍력 수익 기반 햇빛연금은 국가계획 반영, 인허가, 재원분담 확인이 필요합니다.",
        sources: [necSource, localAutonomyLawSource, gtxPlanningSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100163134": {
    summary: "천원 복지·국제자유특별시·광역철도 공약은 법률 제정과 지속 재원 검증이 중요합니다.",
    tone: "caution",
    items: [
      {
        claim: "천원 유니버스, 인천국제자유특별시, 인천 전역 역세권",
        verdict: "권한 확인 필요",
        check:
          "인천시 자체 복지와 철도망 건의는 추진 가능하지만, 수도권 규제 철폐, 공공기관 이관, 구 신설, GTX-D·E 및 제2공항철도는 특별법·국가계획·예타와 국비·시비 분담 확인이 필요합니다.",
        sources: [necSource, localAutonomyLawSource, gtxPlanningSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100153769": {
    summary:
      "바이오·교통·원도심·행정혁신 공약은 지방정부 권한 안에서 설계 가능하나, GTX와 산업단지는 국가계획·민간투자가 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "바이오 소부장 허브, 출퇴근 30분 인천, 청년·소상공인 경제특별시",
        verdict: "권한 확인 필요",
        check:
          "기업지원, 도시재생, 행정정보 공개는 지방정부 사무와 연결됩니다. GTX-B·D, 바이오 산업단지 전환, 대규모 청년창업펀드와 생활SOC 확충은 국가사업 반영, 인허가, 민간투자 및 재원계획 확인이 필요합니다.",
        sources: [necSource, localAutonomyLawSource, gtxPlanningSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100153736": {
    summary: "민생·청년·탄소중립·AI·복지 공약은 대전시 정책으로 검토 가능하지만, 펀드·연금·산업특구는 재원과 제도 설계가 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "온통대전 2.0, 청년주택 5,000호, 분산에너지 특구, 4050 징검다리 연금",
        verdict: "재원 확인 필요",
        check:
          "지역화폐, 청년주택, 돌봄체계, AI 행정은 지방정부 사무와 연결됩니다. 에너지공사, 햇빛연금, GPU 거점센터, 4050 연금은 국비 공모, 조례, 운용 재원과 장기 지급 책임 확인이 필요합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100163200": {
    summary: "7대 전략산업과 청년·교육·문화 공약은 기존 시정 방향과 연결되지만, 무궤도 트램 임기 내 완공은 절차 검증이 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "ABCDEQR 전략산업, 청년복합개발, 무궤도 트램 3·4·5·6호선",
        verdict: "재원 확인 필요",
        check:
          "전략산업 육성과 청년주거 복합개발은 지방정부가 추진할 수 있습니다. 국가산단·특화단지, 교육지원금의 교육재정 활용, 63km 규모 무궤도 트램은 국가재정·규제특례·교통계획 절차와 사업비 검증이 필요합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100153978": {
    summary: "안전·소통·교통·지역금융 공약은 지방행정 혁신과 맞지만, 소방 권한·광역철도·은행 설립은 법령 확인이 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "대전지킴이, 대플릭스, CTX·지하철 3호선, 대전은행",
        verdict: "권한 확인 필요",
        check:
          "시민 플랫폼, 체육시설 관리, 지역 커뮤니티 지원은 지방정부가 추진할 수 있습니다. 소방관 면책·처우, 광역철도 조기착공, 충청권 거점은행 설립, 고금리 과학적금은 상위 법령·인허가·국비와 금융감독 절차 확인이 필요합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100162996": {
    summary:
      "교통·산업전환·에너지·복지 공약은 울산시 정책 영역과 맞닿지만, 광역철도·항만·해상풍력·공공의료는 중앙정부 협의와 재원 구조 확인이 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "버스 공영제, 트램·광역철도, 울산항 에너지 물류 허브, 공공의료·돌봄 확대",
        verdict: "권한 확인 필요",
        check:
          "대중교통·복지·산업지원은 지방정부가 추진할 수 있는 영역이지만, 광역철도·항만시설·해상풍력·공공의료 확충은 국가계획, 인허가, 중앙부처 협의, 국비·민자 조달을 나눠 확인해야 합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100163070": {
    summary:
      "AI·에너지·교통·복지 공약은 대규모 투자와 국가 인프라가 많아 울산시 단독 실행보다 재원과 중앙정부 절차가 핵심입니다.",
    tone: "caution",
    items: [
      {
        claim: "AI 데이터센터, 수소트램·광역철도, 북극항로 거점항만, 울산의료원과 교통복지",
        verdict: "재원 확인 필요",
        check:
          "산업 육성, 교통, 복지 지원은 지방정책으로 설계할 수 있으나 데이터센터·철도·항만·의료원·현금성 지원은 국비, 시비, 민자, 인력 운영비가 반복적으로 필요합니다. 사업별 예비타당성, 인허가, 협약 여부를 확인해야 합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100153854": {
    summary:
      "공사 설립, 무상교통, 공공의료·돌봄, 청년예산 확대는 지방정부 권한과 관련되지만 반복 재원과 지방공기업 설립 절차가 쟁점입니다.",
    tone: "caution",
    items: [
      {
        claim: "울산에너지공사·울산교통공사·울산돌봄공사 설립과 청년 무상버스 확대",
        verdict: "권한 확인 필요",
        check:
          "지방공기업 설립과 교통·돌봄 확대는 조례와 지방의회 예산 심의를 거쳐 검토할 수 있습니다. 다만 공사 출자, 운영손실 보전, 무상교통 확대, 공공의료 건립은 지속 재원과 중앙정부 사업 연계를 확인해야 합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100157730": {
    summary:
      "경제협의체와 산업지원은 추진 가능성이 있으나, 원전 유치·반도체 대규모 투자·현금성 출산지원·청년주거는 권한과 재원 검증이 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "원전 추가 유치, 반도체 50조~100조 투자 유치, 출산·양육 현금지원과 청년주거 확대",
        verdict: "권한 확인 필요",
        check:
          "시장 직속 협의체와 지역 산업지원은 지방정부가 설계할 수 있지만, 원전 입지와 대규모 민간투자 유치는 국가 에너지정책·기업 의사결정과 연결됩니다. 출산지원금, 월세지원, 임대아파트 공급은 대상·기간·재원 규모 확인이 필요합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100153754": {
    summary:
      "행정수도·KTX역·공공기관 이전은 국가 입법·계획 절차가 크고, 자족도시·복지·교통 공약은 재원과 기관 협의가 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "행정수도특별법, 개헌, 대통령실·국회·중앙부처 이전, KTX 세종중앙역",
        verdict: "권한 확인 필요",
        check:
          "행정수도 명문화, 특별법 제정, 국가기관 이전, KTX역 신설은 세종시장 단독 결정이 아니라 국회, 중앙정부, 국가철도 계획, 재정 절차가 필요한 사안입니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100161690": {
    summary:
      "행정수도 완성, CTX·도로, 공공주택, 가족·돌봄·AI 도시 공약은 대부분 국가사업 또는 반복 지출과 결합되어 절차 확인이 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "행정수도 개헌·특별법, CTX 확충, 공무원 주택공급, 365 돌봄과 AI 혁신도시",
        verdict: "권한 확인 필요",
        check:
          "개헌·특별법·기관 이전·광역철도는 국회와 중앙정부 절차가 필요합니다. 돌봄, 여민전 확대, 주거·AI 사업은 지방사업으로 설계 가능하지만 조례, 예산, 개인정보·운영 책임을 별도 확인해야 합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100158883": {
    summary:
      "행정수도 개헌과 세종형 부담금은 입법 의존도가 높고, 금강 개발·대중교통 개선은 환경·교통 절차와 재원 확인이 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "행정수도 명문화 개헌, 세종형 조세대납부담금, 금강 르네상스와 대중교통 전면 개편",
        verdict: "권한 확인 필요",
        check:
          "개헌과 국가 소유 부지 부담금은 국회·중앙정부 법제화가 핵심입니다. 금강 수변개발과 대중교통 개편은 지방정부가 추진할 수 있으나 환경 협의, 노선 운영비, 국비 공모 여부를 확인해야 합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100157160": {
    summary:
      "청년주거·식품·산림·관광 공약은 도 정책과 연결되지만, 민통선·재생에너지·복합관광단지는 규제와 민자 조달 검증이 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "청정에너지 고속도로, 강원청정연금, 식품·숲경제 클러스터, 복합 관광단지",
        verdict: "권한 확인 필요",
        check:
          "청년주거와 지역산업 지원은 도·시군 협력사업으로 검토할 수 있습니다. 다만 민통선 조정, 군사규제 완화, 재생에너지 수익연금, 대규모 관광단지는 중앙정부 협의, 입지 규제, 민간투자 실현성을 확인해야 합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100162343": {
    summary: "4대 도민연금과 반값 지원, 대학등록금, 소상공인 자금 확대는 대상과 분담률이 제시됐지만 반복 재정 부담 확인이 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "강원형 4대 도민연금, 반값 육아용품·농어업임업 자재, 대학생 무상교육, 소상공인 자금 2배 확대",
        verdict: "재원 확인 필요",
        check:
          "현금성·가격보조·이자지원 사업은 지방정부가 조례와 예산으로 추진할 수 있으나 매년 반복되는 재정 부담이 큽니다. 국비 매칭, 시군 분담, 사회보장 협의, 금융기관 협약이 실제 집행의 핵심입니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100153742": {
    summary: "창업·공공기관 이전·공항·광역철도·청년위원회 공약은 정책 방향은 명확하지만 중앙정부 계획 반영 여부가 중요합니다.",
    tone: "caution",
    items: [
      {
        claim: "2차 공공기관 이전, 청주공항 민간 전용 활주로, 중부권 광역급행철도",
        verdict: "권한 확인 필요",
        check:
          "창업지원과 청년위원회는 도 조례·예산으로 검토할 수 있습니다. 그러나 공공기관 이전, 공항 활주로, 광역급행철도는 국토교통부 등 중앙정부 계획, 예비타당성, 국비·민자 구조 확인이 필요합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100163211": {
    summary: "돔구장·AI 데이터센터·K-바이오스퀘어·공항 활주로·관광 사업은 대규모 재원이 필요한 개발형 공약입니다.",
    tone: "caution",
    items: [
      {
        claim: "돔구장과 프로야구단, AI 데이터센터, K-바이오스퀘어, 청주공항 민간전용활주로",
        verdict: "재원 확인 필요",
        check:
          "후보 공약은 국비·지방비·민자 조달을 전제로 합니다. 체육시설, 데이터센터, 바이오 거점, 공항 인프라는 수요·입지·운영주체·국가계획 반영과 지방재정 부담을 분리해 확인해야 합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100163153": {
    summary:
      "AI 전환과 관광·환경·교통 공약은 충남 정책 영역과 맞닿지만, 대전 통합과 광역교통·공항은 입법·국가계획 절차가 큽니다.",
    tone: "caution",
    items: [
      {
        claim: "충남·대전 통합특별시, AI 수도, 백제문화권, 석탄화력 전환, 서산공항·GTX-C 연장",
        verdict: "권한 확인 필요",
        check:
          "AI·관광·환경 지원은 도 사업으로 설계할 수 있으나 행정통합, 특별법, 공항, 광역철도, GTX 연장은 국회·중앙정부·관계 지자체 협의와 국가재정 절차가 필요합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100163640": {
    summary: "돔 아레나, AI 인력, 베이밸리, 충남·대전 통합, 농어촌 지원은 권한과 재원이 넓게 걸친 공약입니다.",
    tone: "caution",
    items: [
      {
        claim: "충남·대전 통합, 베이밸리 메가시티, CTX·GTX-C, 돔 아레나, 탄소중립 전환펀드 1조원",
        verdict: "권한 확인 필요",
        check:
          "도 차원의 산업·농어촌 지원은 추진 가능하지만 행정통합, 경제자유구역, 광역철도, 군부대 이전, 대형 문화시설은 법령·중앙부처·관계 지자체 협의가 필요합니다. 펀드와 시설 사업은 재원 출처와 손실 부담도 확인해야 합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100163170": {
    summary:
      "새만금 SOC와 에너지·AI·기본소득 공약은 전북 전략과 연결되지만, 특별법 개정과 국가재정 전환, 반복 재원이 핵심 변수입니다.",
    tone: "caution",
    items: [
      {
        claim: "전북특별법 개정, 피지컬AI 규제자유특구, 새만금 SOC 조기 완공, 농어촌·예술인 기본소득",
        verdict: "권한 확인 필요",
        check:
          "특별법 개정, 규제자유특구, 새만금 공항·철도·항만 조기 완공은 국회와 중앙정부 절차가 필요합니다. 기본소득과 도민 프로젝트 예산은 지방사업으로 검토 가능하지만 지속 재원과 사회보장 협의를 확인해야 합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100163202": {
    summary: "새만금·비응항·국제공항·원전·외국인 정착·기업 인허가 공약은 국가 인프라와 규제 권한 확인이 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "비응항 물류·에너지 허브, 원전 유치, 새만금 국제공항 재개, 외국인 장기체류 지원, 인허가 고속도로팀",
        verdict: "권한 확인 필요",
        check:
          "도지사 직속 기업지원 조직과 지역산업 지원은 가능하지만 항만·공항·원전·체류자격·국적취득은 중앙정부 권한이 큽니다. 민자와 국가 SOC 예산 확보 가능성도 별도 검증이 필요합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100162052": {
    summary:
      "호남 메가시티, 공공은행·에너지공사, 통합돌봄, 기본소득은 지방정부 역할과 맞닿지만 법률·금융인가·반복 재원 확인이 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "호남권 메가시티, 전북공공은행, 전북에너지공사, 농어촌·예술인 기본소득, 버스 무상화",
        verdict: "권한 확인 필요",
        check:
          "특별지방자치단체와 지방공기업은 법령·조례 절차가 필요하고, 공공은행은 금융 인가와 상위 법령 검토가 핵심입니다. 기본소득·무상교통·돌봄 확대는 대상과 연간 재원 규모를 확인해야 합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100153829": {
    summary:
      "7조 자산펀드, STO, 공공형 카지노, 지역순환경제는 제도 불확실성이 커서 법률·금융·사행산업 규제 확인이 우선입니다.",
    tone: "unknown",
    items: [
      {
        claim: "새만금 자산 금융화, 7조 전북 자산 펀드, STO 플랫폼, 공공형 카지노",
        verdict: "권한 확인 필요",
        check:
          "실물자산 금융화와 토큰증권, 카지노 운영은 지방정부 단독 사업으로 보기 어렵고 금융·자본시장·사행산업 관련 법령과 중앙정부 승인 절차가 필요합니다. 예상 수익을 복지 재원으로 쓰는 구조는 실현 전까지 재원으로 확정하기 어렵습니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100163514": {
    summary:
      "투자유치·농생명·문화관광·새만금·특별법 공약은 기존 도정 방향과 연결되지만 국가예산, 입법, 민간투자 성사 여부가 관건입니다.",
    tone: "caution",
    items: [
      {
        claim: "50조 투자유치, 대기업 계열사 15개 유치, 새만금 RE100 특구·SOC, 전주 하계올림픽 유치",
        verdict: "재원 확인 필요",
        check:
          "투자유치형 공약은 지방정부가 지원할 수 있으나 기업 투자와 고용은 확정 권한 밖입니다. 새만금 공항·신항·메가샌드박스, 올림픽 유치, 특별법 개정은 중앙정부·국회·국제 절차와 국비·민자 확보를 확인해야 합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100161413": {
    summary:
      "행정통합·신공항·국립의대·에너지연금 공약은 광역 의제와 맞닿지만 특별법, 중앙정부 협의, 대규모 재원 절차가 핵심입니다.",
    tone: "caution",
    items: [
      {
        claim: "대구·경북 행정통합, TK 통합신공항·영일만항 기반 물류경제권",
        verdict: "권한 확인 필요",
        check:
          "행정통합과 특별시 출범은 도 단독 결정이 아니라 특별법, 대구시·시군·국회·중앙정부 절차가 필요합니다. 신공항·항만·산업단지도 국가계획 반영과 재원 분담을 따로 확인해야 합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
      {
        claim: "국립의대·상급종합병원 설립, 에너지연금과 전기요금 지원",
        verdict: "재원 확인 필요",
        check:
          "의대·상급종합병원은 보건의료 정책과 중앙정부 지정·정원 절차가 걸립니다. 발전수익 환원, 전기요금 지원, 에너지연금은 조례·기금·국비·요금제 권한을 분리해 검증해야 합니다.",
        sources: [necSource, localAutonomyLawSource],
      },
    ],
  },
  "20260603-320260603-100159249": {
    summary:
      "행정통합·투포트 경제권·첨단산업·복지 공약은 기존 도정 의제와 연결되지만 법률, 국가계획, 반복 재원 확인이 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "대구·경북 행정통합과 재정특례·권한이양·규제특례",
        verdict: "권한 확인 필요",
        check:
          "행정통합 특별법, 권한 이양, 재정특례는 지방정부 추진만으로 확정되지 않습니다. 국회 입법, 중앙정부 협의, 주민 공감대와 시도 간 합의 절차가 함께 필요합니다.",
        sources: [necSource, localAutonomyLawSource],
      },
      {
        claim: "신공항·영일만항 투포트 경제권, 첫걸음연금·필수의료 확충",
        verdict: "재원 확인 필요",
        check:
          "공항·항만·철도·물류단지는 국가계획과 국비 확보 여부가 핵심입니다. 첫걸음연금, 어르신 건강밥상, 국립의대·공공의료 확충은 대상 규모와 반복 재원, 중앙정부 의료정책 절차를 확인해야 합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100158507": {
    summary:
      "부울경 광역교통·주력산업·공공의료 공약은 초광역 협력과 국가사업 의존도가 커서 도 단독 실행 범위를 나눠 봐야 합니다.",
    tone: "caution",
    items: [
      {
        claim: "부울경 메가시티 복원, 4대 광역철도망과 30분 생활권",
        verdict: "권한 확인 필요",
        check:
          "광역철도, 신공항 연계, 광역교통공사 설립은 경남도 정책으로 제안할 수 있지만 부산·울산, 국토교통부, 국가계획, 타당성 조사, 재원 분담 절차가 필요합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
      {
        claim: "공공의료 특별회계, 지역필수의사제, 우주항공복합도시",
        verdict: "재원 확인 필요",
        check:
          "공공병원·닥터헬기·의료인력 지원은 지방 의료정책과 맞닿지만 의사제도와 병원 확충은 중앙정부 정책과 인력·예산 절차가 큽니다. 우주항공복합도시도 특별법과 국가 R&D·기반시설 재원이 확인되어야 합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100162958": {
    summary:
      "도민 멤버십·청년연금·HPV 접종은 도 사업으로 설계 가능하지만 기금 조성, 민간 협약, 반복 지출 규모가 관건입니다.",
    tone: "caution",
    items: [
      {
        claim: "경남도민 멤버십 카드와 경남 청년연금",
        verdict: "재원 확인 필요",
        check:
          "공공시설 할인, 복지바우처, 청년 자산형성은 조례와 예산으로 검토할 수 있습니다. 다만 민간 카드사·은행 협약, 도민행복기금 조성, 가입자 규모별 반복 지출 추계가 필요합니다.",
        sources: [necSource, localAutonomyLawSource],
      },
      {
        claim: "G-버스 도입, 제조 피지컬 AI 기반, 여성 HPV 접종",
        verdict: "권한 확인 필요",
        check:
          "광역급행버스는 부산·울산 협의와 대도시권 광역교통 승인 절차가 필요합니다. AI 기반 확충은 정부 예타 면제 사업과 민간투자 집행 구조를, HPV 접종은 시군·의료기관 협약과 지속 재원을 확인해야 합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100153781": {
    summary: "공공은행·노동권·공공의료 확대 공약은 지방 조례 영역을 넘는 법률 개정 항목이 많아 권한 구분이 필요합니다.",
    tone: "caution",
    items: [
      {
        claim: "지역공공은행, 지역재투자법, 공공재생에너지 공영화",
        verdict: "권한 확인 필요",
        check:
          "지역화폐·공공조달·에너지 공사 설립은 지방정책으로 검토할 수 있지만, 은행 설립과 지역재투자법 제정, 에너지 소유·운영 의무화는 금융·에너지 법령과 국회 입법 절차를 확인해야 합니다.",
        sources: [necSource, localAutonomyLawSource],
      },
      {
        claim: "노동권 보장, 공공의대·지역의사제, 공공일자리 확대",
        verdict: "권한 확인 필요",
        check:
          "지자체 노동센터·조례·공공서비스 직영화는 추진 가능성이 있으나 근로기준법 개정, 징벌적 손해배상, 공공의대, 의대정원, 간호인력 법제화는 중앙정부·국회 권한입니다. 공공일자리 확대는 예산 규모도 확인해야 합니다.",
        sources: [necSource, localAutonomyLawSource],
      },
    ],
  },
  "20260603-320260603-100163197": {
    summary:
      "민생추경·기본사회·물가안정기금 공약은 도정 사업으로 검토 가능하지만 지방의회 예산 심의와 기금 재원이 핵심입니다.",
    tone: "caution",
    items: [
      {
        claim: "7월 민생추경 3,000억 원과 제주형 기본사회 선도지역",
        verdict: "재원 확인 필요",
        check:
          "추경 편성은 도지사가 추진할 수 있으나 지방의회 심의, 순세계잉여금·구조조정 가능액, 집행 대상 기준을 확인해야 합니다. 기본사회 사업은 국비·지방비와 통합기금 규모가 필요합니다.",
        sources: [necSource, localAutonomyLawSource],
      },
      {
        claim: "물가안정기금 1,000억 원, 공공 비축물량 방출, 주민참여예산 일반회계 1%",
        verdict: "권한 확인 필요",
        check:
          "물가 모니터링과 생활행정 조직은 지방정부 사무로 볼 수 있지만, 가격 관리와 비축물량 방출은 품목별 권한과 조달 구조를 확인해야 합니다. 주민참여예산 확대도 조례와 예산 편성권 범위 안에서 검토되어야 합니다.",
        sources: [necSource, localAutonomyLawSource],
      },
    ],
  },
  "20260603-320260603-100157851": {
    summary:
      "투자청·상급종합병원·청년정착·관광 공약은 제주도 정책과 연결되지만 의료 지정과 재원 구조는 중앙정부 협의가 큽니다.",
    tone: "caution",
    items: [
      {
        claim: "제주 투자청 설립과 5대 미래 성장축, 혁신기업 200개 육성",
        verdict: "재원 확인 필요",
        check:
          "투자유치 조직과 산업 육성은 도 정책으로 설계할 수 있으나, 국비 매칭펀드, 민간투자 유치, 기존 사업 구조조정 규모가 확인되어야 합니다.",
        sources: [necSource, localAutonomyLawSource],
      },
      {
        claim: "상급종합병원 지정과 중입자 치료기 도입",
        verdict: "권한 확인 필요",
        check:
          "상급종합병원 지정은 지방정부가 단독 결정할 수 있는 사안이 아니며 보건당국 기준과 병원 역량 평가가 필요합니다. 중입자 치료기 도입도 국비·도비·민간 의료기관 부담과 운영비를 따로 확인해야 합니다.",
        sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
      },
    ],
  },
  "20260603-320260603-100153886": {
    summary:
      "지역순환경제·1차산업·대중교통 공영제 공약은 도 정책으로 검토 가능하지만 시장 개입과 공영화 비용은 보수적으로 봐야 합니다.",
    tone: "caution",
    items: [
      {
        claim: "제주형 지역순환경제, 공공수매, 생산자 중심 가격 안정체계",
        verdict: "권한 확인 필요",
        check:
          "공공예산 지역환류, 지역 소비 촉진, 농어민 지원은 지방정책과 연결됩니다. 다만 공공수매와 가격 안정체계는 품목별 법령, 국비사업, 시장 영향, 예산 부담을 확인해야 합니다.",
        sources: [necSource, localAutonomyLawSource],
      },
      {
        claim: "대중교통 전면 개편과 단계적 공영제, 원도심 복합개발",
        verdict: "재원 확인 필요",
        check:
          "버스 노선 개편과 교통약자 지원은 도 권한과 맞닿지만 공영제 확대는 보조금·인수·운영비 구조가 핵심입니다. 원도심 복합개발은 도시재생 공모, 용적률 조정, 민간참여 조건을 확인해야 합니다.",
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
  "20260603-1120260603-100153856": { summary: "무상 돌봄, AI 플랫폼, 전담교사 배치 공약은 교육청 사무와 연결되지만 전일제 전환·대규모 인건비·국비 전제는 확인이 필요합니다.", tone: "caution", items: [{ claim: "초1~6 5일 무상돌봄, AI 학습·입시 플랫폼, 학교폭력 전담교사 배치", verdict: "재원 확인 필요", check: "돌봄·학습지원·학교폭력 대응은 교육청 사업으로 검토할 수 있습니다. 다만 돌봄전담사 전일제 전환, 전 학교 전담인력, AI 플랫폼 운영은 반복 인건비와 지방교육재정교부금·국비 확보 여부를 따로 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100160673": { summary: "AI 미래교육, 고교 스터디룸, 특수교육원 신설은 교육청 정책 영역이지만 시설·인력·플랫폼 재원이 핵심입니다.", tone: "caution", items: [{ claim: "AI 튜터·생성형 AI 제공, 고교 스터디룸, 특수교육원·특수 특성화고 신설", verdict: "재원 확인 필요", check: "AI 교육과 학교 공간 개선은 교육청이 추진할 수 있으나, 생성형 AI 이용 지원과 학교·기관 신설은 조달비, 유지비, 교원·전문인력 배치, 중장기 시설계획을 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153771": { summary: "기초학력·무상돌봄·특수학교·마을교육 공약은 교육청 권한과 닿지만 법 개정과 지자체 협력 항목은 분리 확인이 필요합니다.", tone: "caution", items: [{ claim: "기초학력전담교사, 무상 돌봄 방과후학교, 특수학교 확충, 학교폭력방지법 개정", verdict: "권한 확인 필요", check: "학습지원·돌봄·특수교육은 교육청 사무와 연결됩니다. 다만 학교폭력 관련 법 개정은 교육감 단독 권한이 아니며, 마을교육·복합문화센터는 지자체 협력과 운영 재원이 필요합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100162107": { summary: "AI 학력관리, 영재학교, 무상지원, 통합 교육행정 공약은 추진 가능성이 있으나 학교 설립·평가·복지 중첩 권한 확인이 필요합니다.", tone: "caution", items: [{ claim: "AI 입시분석, 교육과정개발평가원, AI·에너지 영재학교, 교복·체험학습 무상화", verdict: "권한 확인 필요", check: "교육청은 교육과정 운영과 진학지원, 교육복지 사업을 추진할 수 있습니다. 다만 영재학교·특성화 학교 설립, 평가기관 신설, 무상급식·청소년복지 중첩 업무는 교육부 기준, 조례, 지자체 협력, 재원을 함께 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100163844": { summary: "AI 교육 대전환과 미래산업 특성화고 공약은 교육청 사업으로 설계 가능하지만 교육과정·전문교원·플랫폼 재원이 관건입니다.", tone: "caution", items: [{ claim: "AI 교육 허브, 통합 AI 학습 플랫폼, 미래산업 교육과정·특성화고 확대", verdict: "권한 확인 필요", check: "AI 수업모델, 교원연수, 특성화고 교육과정 개편은 교육청 정책과 연결됩니다. 다만 국가 교육과정 범위, 전문교원 양성, 플랫폼 구축·유지비, 산업체 협력 구조를 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153847": { summary: "AI 학습시스템, 기초학력 책임보장, 무상교육·통학비 지원은 교육청 예산과 지자체 협력 여부가 핵심입니다.", tone: "caution", items: [{ claim: "전 학교 AI 학습시스템, 기초학력 책임보장, 유치원 무상교육, 통학비 전면 지원", verdict: "재원 확인 필요", check: "학습지원과 돌봄·교육복지는 교육청 사업으로 검토할 수 있습니다. 그러나 무상교육·통학비·돌봄 확대는 반복 지출이 크고, 유아·통학 영역은 지자체 및 관련 예산 분담을 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100162788": { summary: "AI 튜터, 기초학력, 교원 지원, 유보통합·무상체험학습 공약은 교육청 사무와 맞지만 시설·인력·재원이 중요합니다.", tone: "caution", items: [{ claim: "AI 튜터 전면 보급, 학력 맞춤교육, 100개 학교 개축, 유보통합·현장체험학습 무상화", verdict: "재원 확인 필요", check: "AI·기초학력·교원지원은 교육청 권한과 연결됩니다. 다만 전면 보급, 학교 개축·리모델링, 유보통합 모델, 수학여행·체험학습 무상화는 교육재정과 지자체 협력, 장기 시설계획 확인이 필요합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153820": { summary: "IB 일반고 전환, AI·로봇 특화학교, 특수교육 예산 확대는 교육청 재량과 국가 기준을 함께 봐야 합니다.", tone: "caution", items: [{ claim: "IB 학교 일반고 전환, AI·로봇 특화학교 설립, 특수교육 예산 3배와 특수학교 신설", verdict: "권한 확인 필요", check: "학교 운영과 특수교육 지원은 교육청 사무와 관련됩니다. 다만 IB 운영 전환, 특화학교 신설, 특수학교 설립은 국가 교육과정, 학교 설립 절차, 교원 수급, 시설·예산 계획을 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100162085": { summary: "기초학력, 생태·AI 교육, 방과후·돌봄 무상지원은 교육청 정책으로 가능하지만 교원·프로그램·급식 재원이 필요합니다.", tone: "caution", items: [{ claim: "1학급 2교사, AI 종합교육, 유·초등 방과후 연 50만 원 지원, 돌봄 간식·점심 무상", verdict: "재원 확인 필요", check: "기초학력 보장과 방과후·돌봄 지원은 교육청 사업으로 검토할 수 있습니다. 다만 1학급 2교사, 무상 프로그램, 급식·간식 지원은 교원 정원, 인건비, 교육비특별회계 지속 가능성을 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100162500": { summary: "책임성장교육, AI-able 교육, 학급·특수교육 개선은 교육청 사무와 맞지만 지자체 대응투자와 인력 계획 확인이 필요합니다.", tone: "caution", items: [{ claim: "대구학습GPT, 기초학력 안전망, AI 비서, 학급당 인원 축소, 특수학교·학급 신증설", verdict: "재원 확인 필요", check: "AI 교육, 기초학력, 학교공간·특수교육 개선은 교육청이 추진할 수 있습니다. 다만 후보 공약이 교육청 자체 예산과 지자체 대응투자를 전제로 하므로 연차별 투자 규모와 전문인력·교원 배치가 확인되어야 합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100163408": { summary: "AI 융합교육, 국제교류, 건강·복지, 과밀학급 해소는 교육청 권한과 연결되지만 학교 신설·교원정원은 중앙 협의가 필요합니다.", tone: "caution", items: [{ claim: "30만 AI 융합인재, 생성형 AI 구독료 지원, 32개 학교 개교, 교원정원 확대와 학급당 20명", verdict: "권한 확인 필요", check: "AI 교육과 교육격차 지원은 교육청 사업으로 검토할 수 있습니다. 그러나 학교 개교, 교원정원 확대, 학급당 학생 수 조정은 교육부 정원·시설 승인과 지방교육재정 계획을 함께 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153794": { summary: "돌봄·학력·AI·안전 올케어 공약은 교육청 사업과 맞닿지만 365급식, AI 교육원, 전담교사 확보는 재원 검증이 필요합니다.", tone: "caution", items: [{ claim: "돌봄 통합 플랫폼, 365일 무상급식, i-EBS, 인천 미래 AI 교육원, 스마트 통학로", verdict: "재원 확인 필요", check: "돌봄·기초학력·AI 교육은 교육청 정책으로 설계할 수 있습니다. 다만 방학·휴일 급식, AI 교육원 설립, 교원 증원, 스마트 통학로는 지자체·교육부 사업비와 반복 운영비를 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153776": { summary: "청소년 성장지원금·무상교통·아침학교·학교시설 복합화는 교육청 단독보다 조례와 지자체 재정 협력이 핵심입니다.", tone: "caution", items: [{ claim: "청소년 성장지원금, 대중교통 무상지원, 인천형 아침학교, 학교 유휴시설 복합화", verdict: "권한 확인 필요", check: "돌봄·학교시설 활용은 교육청 사무와 연결되지만, 성장지원금과 대중교통 무상지원은 조례·교통행정·지자체 예산 협력이 필요합니다. 유휴시설 개방도 안전관리와 운영비 분담을 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153741": { summary: "기초학력, AI 미래교육, 온마을 돌봄, 학교 신설·재배치는 교육청 권한과 맞닿지만 국가 기준과 지자체 협력이 필요합니다.", tone: "caution", items: [{ claim: "기초학력 전수진단, AI 디지털교육, 온마을 365돌봄, 특성화 중학교·대안학교·중고교 신설", verdict: "권한 확인 필요", check: "학습지원·돌봄·학교 배치는 교육청 정책 영역입니다. 다만 학교 신설·재배치, 특성화 학교, AI 디지털교과 연계는 교육부 기준, 시설계획, 지자체 협력 예산을 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153739": { summary: "안심교육, 기초학력, 유보통합, 학교 선택권, 과밀 해소 공약은 대부분 교육청 사무지만 범위가 넓어 우선순위와 재원이 관건입니다.", tone: "caution", items: [{ claim: "7대 안심교육, 배움 탄탄 책임제, 대전형 유보통합, 다양성 학교, 과밀 해소 학교 신설", verdict: "재원 확인 필요", check: "안전·학습지원·학교행정 개선은 교육청이 추진할 수 있습니다. 다만 유보통합, 학교 선택권 확대, 학교 신설은 국가 기준과 시설·교원 수급, 교육비특별회계 배분 계획을 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153764": { summary: "기초학력 3단계 안전망, 급식·시설 안전, 특수학교 신설, 평등예산제는 교육청 책무와 연결되지만 인력·시설 재원이 큽니다.", tone: "caution", items: [{ claim: "기초학력책임보장 TF, 급식노동자 처우 개선, 특수학교 신설, 학교평등예산제", verdict: "재원 확인 필요", check: "기초학력, 학교안전, 특수교육, 교육격차 지원은 교육청 사무와 맞닿습니다. 다만 급식 인력 기준 개선, 특수학교·특수학급 확충, 취약학교 추가예산은 인건비와 시설비, 본예산 증액 가능성을 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153740": { summary: "교육격차 해소, 안심학교, AI 서버팜 공약은 교육청 정책으로 검토 가능하지만 시 특별교부금·매칭투자 전제가 확인 대상입니다.", tone: "caution", items: [{ claim: "1인 1 AI 학습 비서, 학교안전지원센터, 학교기본운영비 증액, 교육청 GPU 서버팜", verdict: "재원 확인 필요", check: "AI 학습지원과 학교안전·운영비 지원은 교육청 사업으로 볼 수 있습니다. 다만 GPU 서버팜, 스마트 출입통제, 동서부 격차 해소 투자는 교육청 예산 외 시 예산·정부 AI 교육예산 매칭 여부를 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153737": { summary: "무상교통, 고교학점제 재설계, AI 과학교육, 급식통합지원센터는 교육청과 대전시 협력 구조를 나눠 봐야 합니다.", tone: "caution", items: [{ claim: "초중고 무상교통, 고교학점제 운영 재설계, AI 과학교육, 먹거리 통합지원센터", verdict: "권한 확인 필요", check: "교육과정 운영과 AI 교육은 교육청 권한과 연결됩니다. 그러나 무상교통과 공공급식 통합지원은 교통·급식 행정과 대전시 일반회계 분담이 필요하므로 교육감 단독 실행 가능성과 재원 협약을 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100161017": { summary: "AI 진학·심야셔틀·해외연수·교권보호 공약은 교육청 사무와 맞닿지만 개인정보, 생활기록부, 반복 재원 확인이 필요합니다.", tone: "caution", items: [{ claim: "AI 입시 코디네이터, 심야 셔틀, 중3 해외연수, 졸업생 100만원 지원", verdict: "재원 확인 필요", check: "진로진학·학생지원은 교육청 사업으로 설계할 수 있으나 셔틀 운영, 해외연수, 바우처성 지원은 교육비특별회계와 울산시 협력 재원의 연차별 규모를 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }, { claim: "중대 교권침해 생활기록부 기재", verdict: "권한 확인 필요", check: "교권보호 지원체계는 교육청 권한과 연결되지만 생활기록부 기재는 초·중등교육 제도와 학생 징계 절차에 맞춰 법령 근거를 확인해야 합니다.", sources: [necSource, elementarySecondaryEducationLawSource] }] },
  "20260603-1120260603-100160241": { summary: "학생성장지원센터, 학급당 20명, AI·디지털 교육, 학교 개방은 추진 가능 영역이나 데이터 처리·교원·시설 운영비가 핵심입니다.", tone: "caution", items: [{ claim: "AI 위기징후 감지, 초1~2 학급당 20명 상한, AI 교육지원센터", verdict: "권한 확인 필요", check: "기초학력·상담·정보화 사업은 교육청 사무와 연결됩니다. 다만 학생 데이터 분석, 학급 증설, 교원·지원인력 배치는 개인정보 기준과 정원·예산 계획 확인이 필요합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }, { claim: "학교 개방, 야간 늘봄 에듀타운, 외솔교육센터", verdict: "재원 확인 필요", check: "학교시설 개방과 돌봄·다문화 지원은 가능하지만 안전관리, 시설관리 책임, 지자체·대학 협력 재원과 운영 인력을 따로 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100156317": { summary: "기초학력·AI·돌봄·무상급식 확대는 교육청 정책 범위이나 스마트기기 보급과 연중 돌봄은 재원 검증이 필요합니다.", tone: "caution", items: [{ claim: "기초학력 책임지도센터, AI교육센터, 1학생 1스마트기기", verdict: "재원 확인 필요", check: "학습지원과 AI 교육은 교육청이 추진할 수 있으나 센터 확대, 스마트기기 보급, 플랫폼 운영은 조달·유지비와 교육재정 계획이 필요합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }, { claim: "연중 안심돌봄, 무상급식 단가 20% 인상, 학교폭력·교권 대응", verdict: "재원 확인 필요", check: "돌봄·급식·안전 사업은 교육청 책무와 연결되지만 보조인력 인건비, 급식비 인상분, 전담팀 운영비를 연차별로 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153756": { summary: "글로벌 진로탐험, AI 학습센터, AI 디지털융합센터는 교육청 사업으로 검토 가능하지만 대규모 해외·디지털 재원이 관건입니다.", tone: "caution", items: [{ claim: "200억 글로벌 진로 탐험대와 AI 학습종합센터·AI 디지털융합센터", verdict: "재원 확인 필요", check: "국제교류와 AI 교육은 교육청 사업으로 설계할 수 있으나 해외 프로그램, 센터 구축, 모든 학교 AI 교육은 반복 재원과 국비·지자체 협력 여부를 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }, { claim: "AI 디지털 특성화고 지정과 교권 지원", verdict: "권한 확인 필요", check: "특성화고 지정·운영과 교권지원은 교육청 권한과 관련되지만 학교 유형, 교육과정, 교원 배치는 국가 기준과 절차를 함께 봐야 합니다.", sources: [necSource, elementarySecondaryEducationLawSource] }] },
  "20260603-1120260603-100153760": { summary: "학생교육수당, 국제영어마을, 기숙형 미래학교, 체육중고·AI국제교육원은 시설·현금성 재원이 큰 공약입니다.", tone: "caution", items: [{ claim: "학생교육수당 월 10만원", verdict: "재원 확인 필요", check: "학생 수당은 교육복지 정책으로 검토할 수 있으나 대상·지급 방식·교육비특별회계 사용 근거와 세종시 협력 재원 규모를 확인해야 합니다.", sources: [necSource, localEducationFinanceSource] }, { claim: "세종국제영어마을, 전원 기숙형 미래학교, 체육중고, AI국제교육원 설립", verdict: "권한 확인 필요", check: "학교·기관 설립과 기숙형 운영은 교육청 권한과 연결되지만 중앙투자심사, 부지, 시설비, 교원 배치, 교육부 특별교부금 확보 여부가 필요합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153758": { summary: "중등평가원, AI 마이스터고, 체육과학중고, 공공 방과후돌봄은 교육청·지자체 협력 구조 확인이 필요합니다.", tone: "caution", items: [{ claim: "세종 중등 교육과정 평가원, 대입지원관, AI 기반 진로지원", verdict: "권한 확인 필요", check: "학력·진로 지원은 교육청 사무이나 평가원 설치와 대입지원관 1:1 배치는 조직·인력·운영 근거와 예산을 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }, { claim: "AI 마이스터고, 체육과학 중·고, 영유아·방과후 돌봄", verdict: "권한 확인 필요", check: "학교 설립과 돌봄 확대는 교육청 단독보다 교육부, 세종시, 시설·교원·돌봄 인력 협력이 필요합니다.", sources: [necSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153759": { summary: "무상 AI 바우처, 돌봄 확대, 교권·행정혁신 공약은 실행 가능성을 보려면 개인정보·구독비·시설비를 나눠 확인해야 합니다.", tone: "caution", items: [{ claim: "AI 모델 구독 바우처, AI 학습센터, AI 성장기록부", verdict: "재원 확인 필요", check: "AI 학습지원은 교육청 정보화 사업으로 검토할 수 있으나 민간 AI 구독비, 학생 데이터 처리, 센터 운영비와 유지관리 예산을 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }, { claim: "영유아 돌봄센터, 늘봄터, 공립대안학교 신설, 교권 면책 시스템", verdict: "권한 확인 필요", check: "돌봄·대안학교·교권보호는 교육청 사무와 관련되지만 영유아 보육, 학교 신설, 면책 제도는 법령·지자체 협력 범위를 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource] }] },
  "20260603-1120260603-100153785": { summary: "기초학력, AI고, AI 데이터센터, 유보돌봄, 통학버스 공약은 교육청 권한과 재정·협력 절차가 섞여 있습니다.", tone: "caution", items: [{ claim: "기초학력전담교사, AI고등학교, AI 유료계정, 강원교육 데이터센터", verdict: "권한 확인 필요", check: "학습지원과 AI 교육은 교육청 정책으로 추진 가능하지만 학교 신설·전환, 교원 확충, 유료 계정 지원과 데이터센터 구축은 교육부 협의와 재정 계획이 필요합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }, { claim: "강원형 유보돌봄통합, 학교폭력 대응, 바로30 버스", verdict: "재원 확인 필요", check: "돌봄·안전·통학 지원은 교육청과 지자체 협력 영역입니다. 차량 운영, 플랫폼, 대응팀 인력은 도·시군비와 교육재정 분담을 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153787": { summary: "학교안전, 기초학력, ESG·글로벌 교육, 지역 학교혁신은 교육청 사업으로 볼 수 있으나 AI 시스템과 통학 지원 재원이 필요합니다.", tone: "caution", items: [{ claim: "AI 기반 학교폭력·위기징후 발견, AI 맞춤형 학습, 글로벌 학습 플랫폼", verdict: "권한 확인 필요", check: "안전·학습지원 정보화는 교육청 사무와 연결되지만 학생 데이터 처리, CCTV·AI 분석 기준, 플랫폼 조달과 운영 기준을 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }, { claim: "적정규모학교, 통학·기숙형 지원, 맞춤형 교육복지", verdict: "재원 확인 필요", check: "지역격차 해소 사업은 가능하지만 통학·기숙 시설과 복지 확대는 교육부 특별교부금, 지자체 협력 재원, 유지비 계획을 확인해야 합니다.", sources: [necSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100162320": { summary: "기초학력, 교권, 특수학교, 무상유아교육, 무상통학은 교육감 사무와 맞닿지만 시설·인력·법령 확인이 큽니다.", tone: "caution", items: [{ claim: "기초학력 책임학년제, 교권 기동대, 원주 특수학교 신설", verdict: "권한 확인 필요", check: "학력지원·교권보호는 교육청 사업이나 특수학교 신설은 부지, 중앙투자심사, 교원·시설 예산 등 절차를 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource] }, { claim: "무상유아교육, 돌봄 석식, 무상통학, 무상 현장체험학습", verdict: "재원 확인 필요", check: "무상지원과 통학·돌봄 확대는 반복 지출이 커서 교육비특별회계, 특별교부금, 지자체 분담의 지속 가능성을 확인해야 합니다.", sources: [necSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153782": { summary: "AI 학력관리, 상담 전문가, 커리어패스, 행정 전담기구는 교육청 조직·인력과 재정 확인이 필요한 공약입니다.", tone: "caution", items: [{ claim: "AI 학습 이력 데이터뱅크, AI 플랫폼 활용비 전액 지원, 이동식 미래교육센터", verdict: "재원 확인 필요", check: "AI 기반 학습·진로 지원은 교육청이 추진할 수 있으나 데이터 관리, 민간 플랫폼 비용, 장비·차량 운영비를 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }, { claim: "1학교 1심리상담 전문가, 교권·민원 대응, 학교 행정지원 전담기구", verdict: "권한 확인 필요", check: "상담·교권·행정지원은 교육청 사무와 관련되지만 전문인력 배치, 조직 신설, 교원 업무 이관 범위는 법령·예산·정원 기준 확인이 필요합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100162804": { summary: "AI 공교육, 학교 신설·학급당 20명, 방과후·돌봄센터는 교육청 공약으로 가능하나 시설과 인력 재원이 핵심입니다.", tone: "caution", items: [{ claim: "충북 AI 교육센터, 지역 AI 거점, 오송 AI 바이오 영재학교 연계", verdict: "권한 확인 필요", check: "AI 교육과 영재교육 연계는 교육청 정책으로 검토 가능하지만 센터 신설, 학교 연계 프로그램, 교원 연수와 장비 예산을 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }, { claim: "수요 맞춤형 학교 신설, 학급당 20명 이하, 거점형 방과후·돌봄미래교육센터", verdict: "재원 확인 필요", check: "학교 신설·학급 감축·돌봄센터는 시설비와 인력비가 커서 중앙투자심사, 교원 수급, 지자체 협력 재원을 확인해야 합니다.", sources: [necSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153743": { summary: "무료 통학버스, 학급당 15명, 글로벌 AI 허브, 미래학교 공약은 대규모 재정과 중앙·지자체 협력이 필요합니다.", tone: "caution", items: [{ claim: "원거리 무료 통학버스, 초1·2 학급당 15명 감축, 영유아 공적 돌봄", verdict: "재원 확인 필요", check: "통학·학급감축·돌봄 확대는 교육복지로 검토할 수 있으나 차량 운영, 교실·교원 확충, 돌봄 인력비를 연차별로 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }, { claim: "유네스코 협력형 글로벌 AI 교육허브, 공공 AI 인프라, 찾아가는 AI 버스", verdict: "권한 확인 필요", check: "AI 교육체계 구축은 교육청 정보화·교육과정 사업과 연결되지만 국제협력, 센터 재편, 플랫폼 구축은 법적 근거와 협약·예산을 확인해야 합니다.", sources: [necSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153825": { summary: "사교육비 제로화, AI 부트캠프 펀드, 시설 개방, 교사 안식년제, 유치원 지원은 재원과 제도 근거 확인이 필요합니다.", tone: "caution", items: [{ claim: "사교육비 제로화와 AI 부트캠프 100만원 펀드", verdict: "재원 확인 필요", check: "공교육 보충과 진로지원은 가능하지만 현금성·바우처성 지원은 대상, 지급 근거, 교육비특별회계 사용 가능성과 지속 재원을 확인해야 합니다.", sources: [necSource, localEducationFinanceSource] }, { claim: "교사 재직 10년 단위 안식년제, 유치원 연중 급식·보건교사 배치", verdict: "권한 확인 필요", check: "교원 복지와 유아 지원은 교육청 정책과 관련되지만 안식년제 확대, 보건교사 배치, 급식 운영은 교원 정원·인건비·관련 법령을 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153788": { summary: "기초학력, 과밀지역 학교 신설, 바우처·통학·특수학교, AI 미래교육은 교육청 사무와 중앙 절차가 섞입니다.", tone: "caution", items: [{ claim: "기초학력 안심지원망, 학교 신설·분교형 캠퍼스, 충남형 공공학구제", verdict: "권한 확인 필요", check: "학력지원과 학구 조정은 교육청 권한과 연결되지만 학교 신설·분교는 부지, 중앙투자심사, 교원·시설 재원을 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource] }, { claim: "도서·나다움 바우처, 안심 통학버스, 특수학교 신설, AI 무상 활용", verdict: "재원 확인 필요", check: "바우처·통학·특수교육·AI 인프라는 반복 지출과 시설비가 큰 항목이므로 교육비특별회계와 지자체 이전수입의 연차 계획이 필요합니다.", sources: [necSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153791": { summary: "AI 학력관리, 학교폭력 AI 모니터링, 학급당 20명, 통학·전문학교·AI센터는 권한과 재원을 함께 봐야 합니다.", tone: "caution", items: [{ claim: "AI 학습이력 관리, AI CCTV 학교폭력 모니터링, AI 행정시스템", verdict: "권한 확인 필요", check: "AI 기반 학습·행정·안전 시스템은 교육청 정보화 사업이지만 학생 개인정보, CCTV 활용, 자동분석 기준과 조달·운영비 확인이 필요합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }, { claim: "학급당 20명 보장, 영재학교·과학고·특수학교 신설, 다이음 통학버스·택시", verdict: "재원 확인 필요", check: "학급 감축과 학교 신설·통학지원은 시설비·인건비·차량 운영비가 커서 지방교육재정교부금, 지자체 교육경비, 중앙 심사 절차를 확인해야 합니다.", sources: [necSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153814": { summary: "AI 튜터, 무상 방과후·돌봄, 학교 신설·학급상한, 지능형 CCTV는 공약에 사업비가 제시됐지만 집행 절차 검증이 필요합니다.", tone: "caution", items: [{ claim: "AI 튜터 진단, 방과후 점진 무상화, 24시간 긴급 돌봄", verdict: "재원 확인 필요", check: "후보 공약은 AI 튜터 176억15백만원, 교육복지 992억79백만원을 제시합니다. 교육청 자체예산·도 협력 사업비가 실제 편성 가능한지와 돌봄 인력 확보가 필요합니다.", sources: [necSource, localEducationFinanceSource] }, { claim: "학급당 학생 수 상한제, 차암중·음봉고·특수학교 신설, 지능형 CCTV·AI 알리미", verdict: "권한 확인 필요", check: "학교 신설과 학급상한은 중앙투자심사·교원 수급·시설비가 필요하고, AI CCTV는 개인정보와 학교 안전 기준 확인이 필요합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100158164": { summary: "AI 통합교육, 교권119, 기초학력, 행복페이·저녁돌봄, 지역균형 교육은 교육청 사업으로 볼 수 있으나 재원과 권한 확인이 필요합니다.", tone: "caution", items: [{ claim: "충남형 AI·디지털 통합교육과정, AI 학습분석 플랫폼, AI 융합교육센터", verdict: "권한 확인 필요", check: "AI·디지털 교육은 교육청 정책으로 추진 가능하지만 독자 교육과정은 국가 교육과정 범위 안에서 운영되어야 하며 플랫폼·센터 예산을 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }, { claim: "교권119, 기초학력 완전책임제, 교육 행복페이, 저녁 7시 책임돌봄", verdict: "재원 확인 필요", check: "교권·학력·돌봄 사업은 교육청 사무와 연결되지만 행복페이 같은 포인트성 지원과 책임돌봄은 조례·대상·반복 재원·지자체 협력 구조를 확인해야 합니다.", sources: [necSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153763": { summary: "학력신장·지역연계·교육복지 공약은 교육청 사무와 맞닿지만, 자립펀드·연 5조 원 재정·대규모 해외연수는 재원과 협력 구조 확인이 필요합니다.", tone: "caution", items: [{ claim: "전북교육과정평가원, AI 특화학교, 자립펀드, 교육재정 연 5조 원", verdict: "재원 확인 필요", check: "교육감은 지역 교육·학예 사무와 교육청 예산 편성을 담당하지만, 평가원 설립, AI 인프라, 학생 자립자산, 외부재원 유치는 조례·조직개편·교육비특별회계·지자체 및 민간 협약이 함께 확인되어야 합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153762": { summary: "기초학력·돌봄·작은학교 공약은 교육청 정책 영역이지만, 교육기본수당과 통학 지원은 반복 재원과 지자체 분담이 핵심입니다.", tone: "caution", items: [{ claim: "어린이·청소년 교육기본수당, 온동네 돌봄, 통학버스·통학택시 확대", verdict: "재원 확인 필요", check: "돌봄·기초학력·지역교육은 교육청 사업으로 추진 가능하지만, 수당성 지원과 통학 지원은 지급 대상, 조례 근거, 교육비특별회계 사용 가능성, 지자체 협력 재원을 따로 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100156976": { summary: "교권보호·고교학점제·AI/IB 수업혁신은 교육청 사무와 관련되지만, 대입 반영과 교원 배치·디지털 인프라는 중앙 협의와 재원이 필요합니다.", tone: "caution", items: [{ claim: "교육과정평가원, 교육지원청 소속 교사제, AIB 미래교실, 대입제도 개선", verdict: "권한 확인 필요", check: "교육감은 학교 교육과 지역 교육과정 운영을 지원할 수 있으나, 대입 반영 방식과 교원 정원은 교육청 단독 결정 사항이 아닙니다. 평가원·플랫폼·미래교실은 설립 근거와 연차별 재원도 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153805": { summary: "무상교육·건강학교·균형교육 공약은 교육복지 확대 방향이지만, 현금성 지원·무상교통·학급당 학생 수 감축은 예산과 교원 수급 검증이 필요합니다.", tone: "caution", items: [{ claim: "사회진출 지원금, 청소년 무상교통, 초1~2 학급당 15명 상한, 학생주치의제", verdict: "재원 확인 필요", check: "교육비 지원과 통학·건강 지원은 교육청과 지자체 협력으로 검토할 수 있습니다. 다만 현금성 지원, 무상교통, 학급당 학생 수 감축은 조례, 교원·공간 확보, 보건·교통 행정 협력, 반복 재원 규모를 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100162976": { summary: "AI·기초학력·특수교육·돌봄 공약은 교육청 사무와 맞닿지만, 특수학교 설립과 지역 돌봄센터·문화센터는 시설·인력·지자체 협력이 중요합니다.", tone: "caution", items: [{ claim: "AI 대전환 미래교육, 미래형 특수학교, 온동네 돌봄·교육센터, 청소년 문화센터", verdict: "재원 확인 필요", check: "디지털 교육, 기초학력, 특수교육, 돌봄은 교육청 정책으로 설계할 수 있습니다. 학교·센터 신설과 지역 연계 돌봄은 부지, 시설비, 교원·전문인력, 지자체 대응투자와 운영비 계획을 함께 봐야 합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153751": { summary: "AI 학습·상담·특수교육·생활교복 지원은 교육청 사업으로 검토 가능하지만, 국제고·문화체험랜드·청소년문화관은 설립 절차와 재원이 큽니다.", tone: "caution", items: [{ claim: "통합예술특성화고·경남국제고 설립, 전 학교 Wee클래스, 글로벌문화체험랜드", verdict: "재원 확인 필요", check: "상담망 확충과 교육복지 지원은 교육청 책무와 연결됩니다. 반면 새 학교나 대규모 체험시설 설립은 학교 설립 절차, 부지 확보, 교육부 협의, 시설비와 운영비, 지자체 분담을 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153784": { summary: "학생교육기본수당·무상교통·체험학습 무상화는 교육복지 확대 공약이지만 반복 지출 규모와 조례 근거가 관건입니다.", tone: "caution", items: [{ claim: "중·고 학생교육기본수당, 등하교 버스비 무료화, 현장체험학습 부담 제로", verdict: "재원 확인 필요", check: "교육비 부담 완화는 교육청 정책 영역과 연결되지만, 월 단위 바우처와 무상교통·체험학습 전액 지원은 지급 기준, 지자체 대응투자, 교육비특별회계 사용 가능성, 장기 재정 부담을 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153823": { summary: "시·군 교육자치와 업무 감축 공약은 조직 운영과 관련되지만, 교육장 공모·성과급 폐지·교원평가 폐지는 법령 권한을 구분해야 합니다.", tone: "caution", items: [{ claim: "시·군 교육장 공모제, 지역교육위원회 예산·인사 의사결정, 성과급·교원평가 폐지", verdict: "권한 확인 필요", check: "교육청 조직 개편과 학교지원 강화는 교육감 권한 안에서 검토할 수 있습니다. 다만 교육장 임용 방식, 지역기구의 예산·인사 권한, 성과급·교원평가 폐지는 상위 법령과 중앙정부 제도와의 관계를 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource] }] },
  "20260603-1120260603-100153770": { summary: "학력·복지·특수교육·지역성장 공약은 교육청 사무와 관련되지만, 다수 학교·센터 신설과 바우처·통학비 지원은 재원과 설립 절차 확인이 필요합니다.", tone: "caution", items: [{ claim: "Edu-CARE 바우처, 100원 등하교 버스, 과학고·영재학교·예술고·체육고·다문화학교 설립", verdict: "재원 확인 필요", check: "교육복지와 특수·다문화 지원은 교육청 사업으로 검토 가능하지만, 바우처와 통학 지원은 반복 재원과 지자체 협력이 필요합니다. 학교 신설·전환은 학교 설립 기준, 교육부 협의, 부지·교원·시설비 확인이 필요합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100153761": { summary: "IB·기초학력·진로 원스톱·교권보호 공약은 교육청 사무와 맞지만, 정무부교육감 임명과 거버넌스는 법령·조례 절차가 중요합니다.", tone: "caution", items: [{ claim: "제주형 IB 2.0, 학생성장 포트폴리오, 정무부교육감 임명, 도정·의회 협력체계", verdict: "권한 확인 필요", check: "교육과정 운영과 진로·기초학력 지원은 교육청 권한과 연결됩니다. 다만 부교육감 임명, 공개 검증, 도정·의회 협력회의 제도화는 법령·조례상 절차와 권한 범위를 먼저 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource] }] },
  "20260603-1120260603-100156980": { summary: "AI 맞춤교육·안심택시·교사 업무 경감·IB 확대는 교육청 정책으로 검토 가능하지만, 실시간 모니터링과 교원제도 개편은 권한·개인정보·재원 확인이 필요합니다.", tone: "caution", items: [{ claim: "AI 심리 모니터링, 안심택시, 학급당 20명 상한, 교원평가·성과급 폐지, KB 국가협력센터", verdict: "권한 확인 필요", check: "AI 학습지원과 통학 지원은 교육청 사업으로 설계할 수 있으나, 웨어러블·위치 기반 안전관리는 학생 개인정보와 운영 기준 확인이 필요합니다. 학급당 학생 수 감축과 교원평가·성과급 폐지는 교원 정원·중앙 제도와 함께 봐야 합니다.", sources: [necSource, localEducationAutonomyLawSource, elementarySecondaryEducationLawSource, localEducationFinanceSource] }] },
  "20260603-1120260603-100162806": { summary: "기초학력·안전·교권·AI·교육복지 공약은 구체적 사업비를 제시했지만, 총액이 큰 시설·인력·무상지원 사업은 재원 안정성 확인이 필요합니다.", tone: "caution", items: [{ claim: "기초학력 804억 원, 안전·마음건강 692억 원, AI·디지털 720억 원, 교육복지·균형발전 1,652억 원", verdict: "재원 확인 필요", check: "교육청은 기초학력, 안전, 디지털 교육, 돌봄·복지를 추진할 수 있습니다. 다만 후보가 제시한 총사업비는 교육비특별회계, 보통교부금, 특별교부금, 제주도 매칭 재원으로 실제 편성 가능한지 연도별 예산안과 인력·시설 계획을 확인해야 합니다.", sources: [necSource, localEducationAutonomyLawSource, localEducationFinanceSource] }] },
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

const guDistrictHeadFactCheck: FactCheckReview = {
  summary:
    "구청장 공약은 생활 인프라, 복지, 상권, 재개발·재건축 지원처럼 주민 생활과 가까운 사무가 많지만 권한과 재원은 구청 단독으로 끝나지 않는 경우가 많습니다.",
  tone: "caution",
  items: [
    {
      claim: "골목상권, 복지·돌봄, 안전, 청년·어르신 지원 같은 생활 행정 확대",
      verdict: "재원 확인 필요",
      check:
        "자치구는 주민 복지, 지역경제, 안전, 시설 관리 등 생활 행정을 추진할 수 있습니다. 다만 현금성 지원, 센터 신설, 인력 확충은 조례, 구의회 예산 심의, 국비·시비·구비 분담과 반복 운영비를 확인해야 합니다.",
      sources: [necSource, localAutonomyLawSource],
    },
    {
      claim: "재개발·재건축, 교통·주차, 공원·문화시설, 학교 주변 환경 개선",
      verdict: "권한 확인 필요",
      check:
        "도시정비, 교통, 공원·문화시설, 교육환경 개선은 구청이 민원 조정과 행정 절차를 맡을 수 있지만 서울시·광역시, 중앙부처, 교육청, 민간 조합·사업자 협의가 필요한 항목이 섞입니다. 후보 공약은 구청장 단독 결정인지, 인허가·상위계획·재원 분담이 필요한지 나눠 봐야 합니다.",
      sources: [necSource, localAutonomyLawSource, nationalFinanceActSource],
    },
  ],
};

type CandidateFactCheckTarget = Pick<Candidate, "id" | "race"> & Partial<Pick<Candidate, "office">>;
type FactCheckTarget = string | CandidateFactCheckTarget;

function isGuDistrictHeadCandidate(target: CandidateFactCheckTarget) {
  return target.race === "기초단체장" && target.office?.endsWith("구청장");
}

export function getCandidateFactCheck(target: FactCheckTarget) {
  const candidateId = typeof target === "string" ? target : target.id;
  const candidateSpecificFactCheck = factChecks[candidateId];

  if (candidateSpecificFactCheck) {
    return candidateSpecificFactCheck;
  }

  if (typeof target !== "string" && isGuDistrictHeadCandidate(target)) {
    return guDistrictHeadFactCheck;
  }

  const race = typeof target === "string" ? undefined : target.race;

  return race ? raceCategoryFactChecks[race] : undefined;
}
