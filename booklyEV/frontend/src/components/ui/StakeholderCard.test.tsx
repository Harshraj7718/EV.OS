import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StakeholderCard } from "./StakeholderCard";

describe("StakeholderCard", () => {
  it("renders the eyebrow, title, and description", () => {
    render(
      <StakeholderCard
        eyebrow="Investor · Passive Income"
        title="Own an EV asset"
        description="Deploy your EV into a managed fleet."
      />,
    );

    expect(screen.getByText("Investor · Passive Income")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Own an EV asset" })).toBeInTheDocument();
    expect(screen.getByText("Deploy your EV into a managed fleet.")).toBeInTheDocument();
  });
});
