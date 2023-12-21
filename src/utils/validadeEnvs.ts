import { IValidateEnvs } from "./../types/TypeValidateEvns";
export const validateEvns = (envs: Array<string>) => {
  const result = {} as IValidateEnvs;
  for (const e of envs) {
    const env = process.env[e];
    if (!env) {
      result.error = `Env ${e} não encontrada`;
      return result;
    }
    result[e] = env;
  }
  return result;
};
