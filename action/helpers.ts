import { axiosClient } from "./axiosClient";
import {
  GetEnvVariablesParams,
  GetRenderServiceSecrets,
  GetServiceParams,
  RenderSecretGetObject,
  ServiceGetObject,
  UpdateServiceSecretsParams,
} from "./types";
import * as core from "@actions/core";
import { AxiosError } from "axios";
import * as dotenv from "dotenv";
import * as fs from "fs/promises";
export const asyncHandler = <T, A>(params: A, func: (e: A) => Promise<T>) => {
  try {
    return func(params);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
    return null;
  }
};
export function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
export const getService = async ({
  renderApiKey,
  renderServiceName,
  cursor,
}: GetServiceParams) => {
  const client = axiosClient(renderApiKey);
  const service = await client.get(`/services`, {
    params: {
      name: renderServiceName,
      cursor,
      limit: 100,
    },
  });
  return service.data as ServiceGetObject[];
};
export const getServiceAsync = async (e: GetServiceParams) =>
  await asyncHandler(e, getService);
export const getAllServicesAsync = async (e: GetServiceParams) => {
  const services: ServiceGetObject[] = [];
  let newData: ServiceGetObject[] | undefined | null = undefined;
  while (newData !== null) {
    //we use this try to reduce rate-limit errors
    await delay(1000);
    newData = await getServiceAsync({
      ...e,
      cursor: newData ? newData[newData.length - 1].cursor : undefined,
    });
    if (!newData) return services;
    services.push(...newData);
    // we need to exit here, since this means we reached the end of the secrets
    if (newData.length <= 0) return services;
  }
  return services;
};
export const readEnvFile = async ({ envFilePath }: GetEnvVariablesParams) => {
  const env = dotenv.parse(await fs.readFile(envFilePath));
  const result = Object.entries(env).map(([key, value]): [string, string] => [
    key,
    value,
  ]);
  return result;
};
export const readEnvFileAsync = async (e: GetEnvVariablesParams) =>
  await asyncHandler(e, readEnvFile);
export const retrieveSecrets = async ({
  serviceId,
  renderApiKey,
  cursor,
}: GetRenderServiceSecrets) => {
  const client = axiosClient(renderApiKey);
  const secrets = await client.get(`/services/${serviceId}/env-vars`, {
    params: {
      cursor,
      limit: 100,
    },
  });
  return secrets.data as RenderSecretGetObject[];
};
export const retrieveSecretsAsync = async (e: GetRenderServiceSecrets) =>
  await asyncHandler(e, retrieveSecrets);
export const retrieveAllSecrets = async (e: GetRenderServiceSecrets) => {
  const secrets: RenderSecretGetObject[] = [];
  let newData: RenderSecretGetObject[] | undefined | null = undefined;
  while (newData !== null) {
    //we use this try to reduce rate-limit errors
    await delay(1000);
    newData = await retrieveSecretsAsync({
      ...e,
      cursor: newData ? newData[newData.length - 1].cursor : undefined,
    });
    if (!newData) return secrets;
    secrets.push(...newData);
    // we need to exit here, since this means we reached the end of the secrets
    if (newData.length <= 0) return secrets;
  }
  //this means we have an error so we return completely
  return secrets;
};
export const retrieveAllSecretsAsync = async (e: GetRenderServiceSecrets) =>
  await asyncHandler(e, retrieveAllSecrets);
export const updateServiceSecrets = async ({
  renderApiKey,
  serviceId,
  body,
}: UpdateServiceSecretsParams) => {
  const client = axiosClient(renderApiKey);
  const secrets = await client.put(`/services/${serviceId}/env-vars`, {
    data: body,
  });
  return secrets.data as RenderSecretGetObject[];
};
export const updateServiceSecretsAsync = async (
  e: UpdateServiceSecretsParams
) => await asyncHandler(e, updateServiceSecrets);
export const triggerDeploy = async ({
  renderApiKey,
  serviceId,
}: {
  renderApiKey: string;
  serviceId: string;
}) => {
  try {
    const client = axiosClient(renderApiKey);
    await client.post(`/services/${serviceId}/deploys`);
  } catch (err: unknown) {
    // we dont throw an error because
    // users can choose to not trigger a deploy
    // but sometimes resource can be busy due to render
    // service currently deploying due to on-click integration
    const castErr = err as AxiosError;
    core.info(`Render: ${castErr.message}`);
  }
};
