import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { QualityCoverage } from "@/app/(dashboard)/dashboard/admin/monitoring/quality-coverage";
const props={coverage:{statements:60.27,branches:56.83,functions:64.92,lines:61.75},libraryCoverage:{statements:84,branches:81,functions:88,lines:84},coverageMeasuredAt:"2026-11-02T14:00:00Z",coverageVersion:"0.50.65"};
describe("nachvollziehbare Testabdeckung",()=>{
 it("zeigt Gesamtumfang, getrennte Bibliothekswerte und Messstand mit deutschen Prozentwerten",async()=>{const {container}=render(<QualityCoverage {...props}/>);expect(screen.getByText(/Gesamter Messumfang/)).toBeInTheDocument();expect(screen.getByText(/Version 0.50.65/)).toBeInTheDocument();expect(screen.getByText(/src\/lib/)).toBeInTheDocument();expect(screen.getByRole("progressbar",{name:"Zeilen – Gesamter Messumfang"})).toHaveAttribute("aria-valuenow","61.75");expect(screen.getByText("61,8 %")).toBeInTheDocument();expect(screen.getByText(/80 %/)).toBeInTheDocument();expect((await axe(container)).violations).toEqual([]);});
 it("erklärt fehlende Messdaten statt historische Prozente einzusetzen",()=>{render(<QualityCoverage coverage={null} libraryCoverage={null} coverageMeasuredAt={null} coverageVersion={null}/>);expect(screen.getByText(/Keine vollständige Coverage-Messung verfügbar/)).toBeInTheDocument();expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();});
});
