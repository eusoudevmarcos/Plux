import { apiFetch } from "@/lib/api";
import type { CompanyProfile, CompanyProfileInput } from "../types";

export function getCompanyProfile() {
  return apiFetch<CompanyProfile | null>("/company-profile");
}

export function saveCompanyProfile(values: CompanyProfileInput) {
  return apiFetch<CompanyProfile>("/company-profile", {
    method: "PUT",
    body: JSON.stringify(values),
  });
}
