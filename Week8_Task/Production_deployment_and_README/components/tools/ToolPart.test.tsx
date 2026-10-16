import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { QUERY_STATES, SAVE_STATES } from "@/test/fixtures";
import { ToolActionsContext, type ToolActions } from "./ToolCard";
import { ToolPart, type DevLogToolPart } from "./ToolPart";

/** Rendered through ToolPart (the router the chat uses), inside the chat's actions context. */
function renderTool(part: DevLogToolPart, actions: Partial<ToolActions> = {}) {
  const value: ToolActions = { retry: vi.fn(), respondToApproval: vi.fn(), ...actions };
  const user = userEvent.setup();
  render(
    <ToolActionsContext value={value}>
      <ToolPart part={part} />
    </ToolActionsContext>,
  );
  return { user, actions: value };
}

describe("queryLogs card", () => {
  it("while the model writes the call: a busy card with a status label and the filters so far", () => {
    renderTool(QUERY_STATES.streaming);

    const card = screen.getByRole("article", { name: "Searching your logs…" });
    expect(card).toHaveAttribute("aria-busy", "true");
    expect(within(card).getByRole("status")).toHaveTextContent("Searching your logs…");
    expect(within(card).getByRole("list", { name: "Search filters" })).toHaveTextContent("Since Sep 21");
  });

  it("while the tool runs: still busy, with the final filters", () => {
    renderTool(QUERY_STATES.working);

    const card = screen.getByRole("article", { name: "Searching your logs" });
    expect(card).toHaveAttribute("aria-busy", "true");
    expect(within(card).getByRole("status")).toHaveTextContent("Searching your logs");
    expect(within(card).getByRole("list", { name: "Search filters" })).toHaveTextContent("Sep 21 – Sep 27");
    expect(card).toHaveTextContent("Chose queryLogs because you asked about last week");
  });

  it("on success: one row per entry, with dates, hours, tags and a total", () => {
    renderTool(QUERY_STATES.done);

    const card = screen.getByRole("article", { name: "Found 3 entries" });
    expect(card).toHaveAttribute("aria-busy", "false");
    expect(within(card).queryByRole("status")).not.toBeInTheDocument();

    const rows = within(card).getAllByRole("listitem").filter((li) => within(li).queryByRole("time"));
    expect(rows).toHaveLength(3);

    const [first, second] = rows;
    expect(within(first).getByText("GitHub OAuth callback")).toBeInTheDocument();
    expect(within(first).getByText("Sun, Sep 27")).toBeInTheDocument();
    expect(within(first).getByText("5h")).toBeInTheDocument();
    expect(within(first).getByRole("list", { name: "Tags" })).toHaveTextContent("#auth#nextjs");
    // An entry without hours shows a dash, announced as "no time logged" (not "0h").
    expect(within(second).getByText("no time logged")).toBeInTheDocument();

    expect(within(card).getByText("8.5h logged on 2 of 3")).toBeInTheDocument();
  });

  it("with no results: a clear empty message and a hint", () => {
    renderTool(QUERY_STATES.empty);

    const card = screen.getByRole("article", { name: "No matching entries" });
    expect(within(card).getByText("Nothing logged for this search")).toBeInTheDocument();
    expect(within(card).getByText("Try a different tag or keyword, or widen the date range.")).toBeInTheDocument();
    expect(within(card).getByText("“kubernetes”")).toBeInTheDocument();
  });

  it("on error: an alert with what went wrong, what was tried, and a working Retry", async () => {
    const { user, actions } = renderTool(QUERY_STATES.error);

    const card = screen.getByRole("article", { name: "Couldn't search your logs" });
    const alert = within(card).getByRole("alert");
    expect(alert).toHaveTextContent('the keyword "fail" makes this tool throw on purpose');
    expect(within(alert).getByText("What I tried")).toBeInTheDocument();
    expect(within(alert).getByRole("list", { name: "Search filters" })).toHaveTextContent("“fail”");

    await user.click(within(alert).getByRole("button", { name: "Retry" }));
    expect(actions.retry).toHaveBeenCalledOnce();
  });

  it("on error while the chat is busy: no Retry button, just guidance", () => {
    renderTool(QUERY_STATES.error, { retry: null });

    const alert = screen.getByRole("alert");
    expect(within(alert).queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
    expect(alert).toHaveTextContent("Ask again to retry.");
  });
});

describe("saveLogEntry card", () => {
  it("asks before saving, and Save / Cancel send the decision", async () => {
    const { user, actions } = renderTool(SAVE_STATES.confirm);

    const card = screen.getByRole("article", { name: "Save this entry to your DevLog?" });
    expect(within(card).getByText("Fixed the flaky contribution graph test")).toBeInTheDocument();

    await user.click(within(card).getByRole("button", { name: "Save entry" }));
    expect(actions.respondToApproval).toHaveBeenLastCalledWith("demo-approval", true);

    await user.click(within(card).getByRole("button", { name: "Cancel" }));
    expect(actions.respondToApproval).toHaveBeenLastCalledWith("demo-approval", false);
  });

  it("once saved: shows the stored entry and links to /logs", () => {
    renderTool(SAVE_STATES.done);

    const card = screen.getByRole("article", { name: "Saved to your DevLog" });
    expect(within(card).getByText("log_a1b2c3d4")).toBeInTheDocument();
    expect(within(card).getByText("Fixed the flaky contribution graph test")).toBeInTheDocument();
    expect(within(card).getByText("Wed, Sep 30")).toBeInTheDocument();
    expect(within(card).getByText("2h")).toBeInTheDocument();
    expect(within(card).getByRole("list", { name: "Tags" })).toHaveTextContent("#testing#ci");
    expect(within(card).getByRole("link", { name: "View in your logs" })).toHaveAttribute("href", "/logs");
  });

  it("on error: an alert with the draft that wasn't saved and Retry", async () => {
    const { user, actions } = renderTool(SAVE_STATES.error);

    const alert = within(screen.getByRole("article", { name: "Couldn't save your entry" })).getByRole("alert");
    expect(alert).toHaveTextContent("the DevLog store didn't respond");
    expect(within(alert).getByText("Fixed the flaky contribution graph test")).toBeInTheDocument();

    await user.click(within(alert).getByRole("button", { name: "Retry" }));
    expect(actions.retry).toHaveBeenCalledOnce();
  });
});
