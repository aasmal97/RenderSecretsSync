import * as core from "@actions/core";
import {
  delay,
  getServiceAsync,
  readEnvFileAsync,
  retrieveAllSecretsAsync,
  triggerDeploy,
  updateServiceSecretsAsync,
} from "./helpers";
import { z } from "zod";
export const ActionSchema = z.object({
  envFilePath: z.string({
    required_error: "ENV_FILE_PATH is required",
    invalid_type_error: "ENV_FILE_PATH must be a string",
  }),
  renderApiKey: z.string({
    required_error: "RENDER_API_KEY is required",
    invalid_type_error: "RENDER_API_KEY must be a string",
  }),
  renderServiceName: z.string({
    required_error: "RENDER_SERVICE_NAME is required",
    invalid_type_error: "RENDER_SERVICE_NAME must be a string",
  }),
  deleteAllNotInEnv: z
    .boolean()
    .or(
      z.string({
        required_error: "DELETE_ALL_NOT_IN_ENV is required",
        invalid_type_error: "DELETE_ALL_NOT_IN_ENV must be a boolean",
      })
    )
    .transform((val) => {
      if (typeof val === "boolean") return val;
      if (typeof val === "string") return val === "true";
      return false;
    }),
  delayDeployAfterSecrets: z
    .string()
    .or(z.number())
    .default(0)
    .transform((val) => {
      if (typeof val === "string") return parseInt(val);
      return Math.round(val);
    })
    .refine(
      (val) => {
        return val >= 0;
      },
      {
        message: "DELAY_DEPLOY_AFTER_SECRETS must be a positive number",
      }
    ),
});
const getInputs = () => {
  core.info("Getting Inputs");
  const envFilePath = core.getInput("ENV_FILE_PATH");
  const renderApiKey = core.getInput("RENDER_API_KEY");
  const renderServiceName = core.getInput("RENDER_SERVICE_NAME");
  const deleteAllNotInEnv = core.getInput("DELETE_ALL_NOT_IN_ENV");
  const delayDeployAfterSecrets = core.getInput("DELAY_DEPLOY_AFTER_SECRETS");
  const data = {
    envFilePath,
    renderApiKey,
    renderServiceName,
    deleteAllNotInEnv,
    delayDeployAfterSecrets,
  };
  const paramsValidationResult = ActionSchema.safeParse(data);
  if (!paramsValidationResult.success) {
    core.setFailed(paramsValidationResult.error.message);
    return new Error(paramsValidationResult.error.message);
  }
  core.info("Inputs Parsed");
  return paramsValidationResult.data;
};
const getNewBody = async ({
  renderApiKey,
  serviceId,
  newSecrets,
  deleteAllNotInEnv,
}: {
  serviceId: string;
  renderApiKey: string;
  newSecrets: [string, string][];
  deleteAllNotInEnv: boolean;
}) => {
  if (deleteAllNotInEnv) {
    return newSecrets.map(([key, value]) => ({
      key,
      value,
    }));
  }
  //if we dont want to delete secrets not included
  const getAllCurrentSecrets = await retrieveAllSecretsAsync({
    serviceId,
    renderApiKey,
  });
  if (!getAllCurrentSecrets) return null;
  const currSecretsArr = getAllCurrentSecrets.map(
    (secret): [string, string] => [secret.envVar.key, secret.envVar.value]
  );
  const allArrs = [...currSecretsArr, ...newSecrets].map(([key, value]) => ({
    [key]: value,
  }));
  const allSecretsObj: Record<string, string> = Object.assign({}, ...allArrs);
  const newBodyArr = Object.entries(allSecretsObj).map(([key, value]) => ({
    key,
    value,
  }));
  return newBodyArr;
};
const main = async () => {
  const data = getInputs();
  if (data instanceof Error) return;
  const {
    envFilePath,
    renderApiKey,
    renderServiceName,
    deleteAllNotInEnv,
    delayDeployAfterSecrets,
  } = data;
  const services = await getServiceAsync({ renderServiceName, renderApiKey });
  if (!services) return;
  const newSecrets = await readEnvFileAsync({ envFilePath });
  if (!newSecrets) return;
  core.info("Secrets Parsed");
  for (let service of services) {
    //we use this try to reduce rate-limit errors
    await delay(1000);
    core.info(`Updating Service: ${service.service.name}`);
    const serviceId = service.service.id;
    const bodyArr = await getNewBody({
      serviceId,
      renderApiKey,
      newSecrets,
      deleteAllNotInEnv,
    });
    if (!bodyArr) return;
    await updateServiceSecretsAsync({
      serviceId,
      renderApiKey,
      body: bodyArr,
    });
    await delay(delayDeployAfterSecrets);
    await triggerDeploy({
      renderApiKey,
      serviceId,
    })
    core.info(`Finished Updated Service: ${service.service.name}`);
  }
};
main();
