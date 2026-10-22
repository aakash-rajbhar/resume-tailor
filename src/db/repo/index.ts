import { getDb, type Db } from "@/db/client";
import { createAccountsRepo } from "./accounts";
import { createCertificationsRepo } from "./certifications";
import { createEducationRepo } from "./education";
import { createExperienceRepo } from "./experience";
import { createJobsRepo } from "./jobs";
import { createProfilesRepo } from "./profiles";
import { createProjectsRepo } from "./projects";
import { createSkillsRepo } from "./skills";
import { createUsersRepo } from "./users";
import { createVerifiedFactsRepo } from "./verifiedFacts";

export * from "./accounts";
export * from "./certifications";
export * from "./education";
export * from "./experience";
export * from "./jobs";
export * from "./profiles";
export * from "./projects";
export * from "./skills";
export * from "./users";
export * from "./verifiedFacts";

export function createRepos(client: Db) {
  return {
    profiles: createProfilesRepo(client),
    experience: createExperienceRepo(client),
    projects: createProjectsRepo(client),
    skills: createSkillsRepo(client),
    education: createEducationRepo(client),
    certifications: createCertificationsRepo(client),
    verifiedFacts: createVerifiedFactsRepo(client),
    jobs: createJobsRepo(client),
    accounts: createAccountsRepo(client),
    users: createUsersRepo(client),
  };
}

export type Repos = ReturnType<typeof createRepos>;

let repos: Repos | null = null;

/**
 * The shared repository instance. It is built on first use so importing this
 * module never requires a database connection.
 */
export function getRepos(): Repos {
  if (!repos) repos = createRepos(getDb());
  return repos;
}
