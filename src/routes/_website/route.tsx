/**
 * Pathless layout route for the public school website.
 * @module routes/_website
 */
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";

export const Route = createFileRoute("/_website")({
  component: WebsiteRouteLayout,
});

/** Wraps all public website pages with shared chrome. */
function WebsiteRouteLayout() {
  return (
    <WebsiteLayout>
      <Outlet />
    </WebsiteLayout>
  );
}
