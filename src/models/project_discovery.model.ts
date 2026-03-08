export type ProbeScope = {
  sourceRoots: string[];
  packageSamples: number;
  candidateBasePackages: string[];
  suggestedInclude?: string;
};

export type DiscoveredProject = {
  id: string;
  rootAbs: string;
  build: "maven" | "gradle";
  markers: string[];
  probeScope: ProbeScope;
};
