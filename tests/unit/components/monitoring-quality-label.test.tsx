import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
vi.mock("next/dynamic",()=>({default:()=>()=>null}));
vi.mock("@/app/(dashboard)/dashboard/admin/monitoring/logs-tab",()=>({LogsTab:()=>null}));
vi.mock("@/app/(dashboard)/dashboard/admin/monitoring/anomalies-tab",()=>({AnomaliesTab:()=>null}));
import { MonitoringDashboard } from "@/app/(dashboard)/dashboard/admin/monitoring/monitoring-dashboard";
it("beschriftet den Qualitätstab mit einem Umlaut",()=>{vi.stubGlobal("fetch",vi.fn(()=>new Promise(()=>{})));render(<MonitoringDashboard/>);expect(screen.getByRole("tab",{name:"Qualität"})).toBeInTheDocument();});
