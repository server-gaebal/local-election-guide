export type NecCandidateInfoRecord = {
  candidateId: string;
  districtName: string;
  number: string;
  partyName: string;
  name: string;
  gender: string;
  birthDate: string;
  age: number;
  address: string;
  occupation: string;
  education: string;
  career: string;
  assets: string;
  military: string;
  taxPaid: string;
  taxArrearsFiveYears: string;
  taxCurrentArrears: string;
  crimeRecord: string;
  electionCount: string;
  crimeDisclosureFiles: string[];
};

export type NecCandidateInfoIndex = Map<string, NecCandidateInfoRecord>;

export function parseCandidateInfoTable(html: string): NecCandidateInfoRecord[] {
  const tbody = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)?.[1] ?? "";
  const rows = Array.from(tbody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi));

  return rows.flatMap((row) => {
    const cells = Array.from(row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)).map((cell) => cell[1]);
    const candidateId = row[1].match(/popupHBJ\('[^']*','(\d+)'\)/)?.[1] ?? row[1].match(/\sid="(\d+)"/)?.[1];
    const nameIndex = cells.findIndex((cell) => cell.includes("popupHBJ"));

    if (!candidateId || nameIndex < 0 || cells.length < nameIndex + 14) {
      return [];
    }

    const standardPartyColumns = nameIndex >= 4;
    const detailStartIndex = nameIndex + 1;
    const birthAndAge = cleanHtml(cells[detailStartIndex + 1]);
    const age = Number.parseInt(birthAndAge.match(/\((\d+)세\)/)?.[1] ?? "", 10);

    return [
      {
        candidateId,
        districtName: cleanHtml(cells[0]),
        number: standardPartyColumns ? cleanHtml(cells[2]) : "",
        partyName: standardPartyColumns ? cleanHtml(cells[3]) : "무소속",
        name: cleanCandidateName(cells[nameIndex]),
        gender: cleanHtml(cells[detailStartIndex]),
        birthDate: birthAndAge.replace(/\s*\(\d+세\).*/, ""),
        age: Number.isFinite(age) ? age : 0,
        address: cleanHtml(cells[detailStartIndex + 2]),
        occupation: cleanHtml(cells[detailStartIndex + 3]),
        education: cleanHtml(cells[detailStartIndex + 4]),
        career: cleanHtml(cells[detailStartIndex + 5]),
        assets: cleanHtml(cells[detailStartIndex + 6]),
        military: cleanHtml(cells[detailStartIndex + 7]),
        taxPaid: cleanHtml(cells[detailStartIndex + 8]),
        taxArrearsFiveYears: cleanHtml(cells[detailStartIndex + 9]),
        taxCurrentArrears: cleanHtml(cells[detailStartIndex + 10]),
        crimeRecord: cleanHtml(cells[detailStartIndex + 11]),
        electionCount: cleanHtml(cells[detailStartIndex + 12]),
        crimeDisclosureFiles: [],
      },
    ];
  });
}

export function createCandidateInfoIndex(records: NecCandidateInfoRecord[]): NecCandidateInfoIndex {
  return new Map(records.map((record) => [record.candidateId, record]));
}

export function isCrimeRecordClean(crimeRecord: string) {
  return crimeRecord === "없음" || crimeRecord === "0건" || crimeRecord.length === 0;
}

function cleanCandidateName(html: string) {
  return cleanHtml(html).replace(/\(.+\)$/, "").trim();
}

function cleanHtml(html: string) {
  return decodeHtml(
    html
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function decodeHtml(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number.parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
