import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSalesList } from "./use-sales";
import { createWrapper } from "@/test/test-utils";
import { mockSales } from "@/test/mocks/handlers";

describe("useSalesList", () => {
  it("returns sales list from API", async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSalesList(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockSales);
  });

  it("starts in loading state", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSalesList(), { wrapper: Wrapper });
    expect(result.current.isLoading).toBe(true);
  });
});
