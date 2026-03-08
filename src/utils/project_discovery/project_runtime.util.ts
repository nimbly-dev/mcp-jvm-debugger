import type { DiscoveredProject } from "../../models/project_discovery.model";
import { discoverProjects } from "./discover_projects.util";

const DEFAULT_PROJECT_DISCOVERY_LIMIT = 100;
const DEFAULT_JAVA_FILE_SAMPLE_LIMIT = 300;

export class ProjectRuntime {
  private discoveredProjects: DiscoveredProject[] = [];
  private lastDiscoveryRootAbs: string;
  private hasExplicitDiscovery = false;

  constructor(initialWorkspaceRootAbs: string) {
    this.lastDiscoveryRootAbs = initialWorkspaceRootAbs;
  }

  get explicitDiscoveryPerformed(): boolean {
    return this.hasExplicitDiscovery;
  }

  async ensureProjects(rootAbs: string): Promise<DiscoveredProject[]> {
    if (this.discoveredProjects.length === 0 || this.lastDiscoveryRootAbs !== rootAbs) {
      this.discoveredProjects = await discoverProjects(
        rootAbs,
        DEFAULT_PROJECT_DISCOVERY_LIMIT,
        DEFAULT_JAVA_FILE_SAMPLE_LIMIT,
      );
      this.lastDiscoveryRootAbs = rootAbs;
    }
    return this.discoveredProjects;
  }

  async discoverExplicit(
    rootAbs: string,
    maxProjects: number,
    maxJavaFilesPerProject: number,
  ): Promise<DiscoveredProject[]> {
    this.discoveredProjects = await discoverProjects(rootAbs, maxProjects, maxJavaFilesPerProject);
    this.lastDiscoveryRootAbs = rootAbs;
    this.hasExplicitDiscovery = true;
    return this.discoveredProjects;
  }

  resetImplicitDiscovery(): void {
    this.hasExplicitDiscovery = false;
    this.discoveredProjects = [];
  }
}
