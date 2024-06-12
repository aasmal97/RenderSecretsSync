export type GetServiceParams = {
  renderServiceName: string;
  renderApiKey: string;
  cursor?: string;
};
export type GetEnvVariablesParams = {
  envFilePath: string;
};
export type GetRenderServiceSecrets = {
  serviceId: string;
  renderApiKey: string;
  cursor?: string;
};
export type RenderSecret = {
  key: string;
  value: string;
};
export type RenderSecretGetObject = {
  envVar: RenderSecret;
  cursor: string;
};

export type ServiceObject = {
  id: string;
  name: string;
  autoDeploy: "yes" | "no";
  branch: string;
  buildFilter: {
    paths: string[];
    ignorePaths: string[];
  };
  createdAt: Date | string;
  environmentId: string;
  imagePath: string;
  notifyOnFail: string;
  ownerId: string;
  registryCredential: {
    id: string;
    name: string;
  };
  repo: string;
  rootDir: string;
  slug: string;
  suspended: "suspended" | "not_suspended";
  suspenders: string[];
  updatedAt: Date | string;
  type:
    | "static_site"
    | "web_service"
    | "private_service"
    | "background_worker"
    | "cron_job";
};
export type ServiceGetObject = {
  service: ServiceObject;
  cursor: string;
};
export type UpdateServiceSecretsParams = {
  renderApiKey: string;
  serviceId: string;
  body: { key: string; value: string }[];
};
