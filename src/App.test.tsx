import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("local election guide mock experience", () => {
  it("filters candidates by residence and voter profile", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText("시도"), "경기도");
    await user.selectOptions(screen.getByLabelText("시군구"), "성남시 분당구");
    await user.selectOptions(screen.getByLabelText("읍면동"), "정자동");
    await user.click(screen.getByRole("button", { name: "학부모" }));

    expect(screen.getByRole("heading", { name: "경기도 성남시 분당구 정자동에서 투표할 후보" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "백서연" })).toBeInTheDocument();
    expect(screen.getByText("교육·돌봄")).toBeInTheDocument();
    expect(screen.queryByText("한지우")).not.toBeInTheDocument();
  });

  it("groups all candidates by the ballots the voter receives", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "서울시장 후보" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "서울특별시교육감 후보" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "마포구청장 후보" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "서울시의원 마포3 후보" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "마포구의원 공덕 후보" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "동장 후보" })).not.toBeInTheDocument();
  });

  it("renders candidate photo slots and bold party labels", () => {
    render(<App />);

    const candidateCard = screen.getByRole("article", { name: /한지우 후보 카드/ });
    expect(within(candidateCard).getByRole("img", { name: "한지우 후보 사진" })).toBeInTheDocument();
    expect(within(candidateCard).getByText("새길시민연합").tagName).toBe("STRONG");
  });

  it("opens a full pledge detail view from a candidate card", async () => {
    const user = userEvent.setup();
    render(<App />);

    const candidateCard = screen.getByRole("article", { name: /한지우 후보 카드/ });
    await user.click(within(candidateCard).getByRole("button", { name: "전체 공약 보기" }));

    const dialog = screen.getByRole("dialog", { name: "한지우 전체 공약" });
    expect(within(dialog).getByText("범죄 기록")).toBeInTheDocument();
    expect(within(dialog).getByText("5대 공약")).toBeInTheDocument();
    expect(within(dialog).getByText("상대 후보와의 차이")).toBeInTheDocument();
  });
});
