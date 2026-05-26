import { describe, expect, it } from "vitest";
import { parseCandidateInfoTable } from "./necCandidateInfo";

describe("NEC candidate info parser", () => {
  it("extracts public disclosure fields from the candidate list table", () => {
    const records = parseCandidateInfoTable(`
<table id="table01">
  <tbody>
    <tr>
      <td class="firstTd">서울특별시</td>
      <td><input type="image" src="photo.jpg" /></td>
      <td class="alignC">1</td>
      <td>더불어민주당</td>
      <td class="alignC">
        <a href="javascript:popupHBJ('0020260603','100157144');" id="100157144">정원오<br/><span class="hanja">(鄭愿伍)</span></a>
      </td>
      <td class="alignC">남</td>
      <td class="alignC">1968.08.12<br/>(57세)</td>
      <td>서울특별시 성동구 왕십리로</td>
      <td>정당인</td>
      <td>한양대학교 도시대학원 도시개발경영전공 박사 수료</td>
      <td>(전)민선 6,7,8기 성동구청장<br/>(전)한양대학교 경영대학 특임교수</td>
      <td class="alignR">1,823,897</td>
      <td class="alignC">군복무를 마친사람</td>
      <td class="alignR">84,423</td>
      <td class="alignR">0</td>
      <td class="alignR">0</td>
      <td class="alignC">2건</td>
      <td class="alignC">3회</td>
    </tr>
  </tbody>
</table>`);

    expect(records).toEqual([
      expect.objectContaining({
        candidateId: "100157144",
        districtName: "서울특별시",
        partyName: "더불어민주당",
        name: "정원오",
        age: 57,
        assets: "1,823,897",
        military: "군복무를 마친사람",
        taxPaid: "84,423",
        crimeRecord: "2건",
        electionCount: "3회",
      }),
    ]);
  });
});
