import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Live</Badge>);
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("applies success variant", () => {
    render(<Badge variant="success">Live</Badge>);
    const el = screen.getByText("Live");
    expect(el.className).toContain("text-tertiary");
  });

  it("applies error variant", () => {
    render(<Badge variant="error">Failed</Badge>);
    const el = screen.getByText("Failed");
    expect(el.className).toContain("text-error");
  });

  it("applies primary variant", () => {
    render(<Badge variant="primary">Processing</Badge>);
    const el = screen.getByText("Processing");
    expect(el.className).toContain("text-primary");
  });
});
