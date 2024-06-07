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
});
