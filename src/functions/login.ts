import type { Handler, APIGatewayEvent } from "aws-lambda";
import {
  DefaultJsonMessage,
  formatDefaultResponse,
} from "../utils/formatResponseUtil";
import { LoginResponse } from "../types/LoginResponse";
import { emailRegex, passwordRegex } from "../contents/Regexes";
import { CognitoServices } from "../services/CognitoServices";
import { validateEvns } from "../utils/validadeEnvs";
import { logger } from "../utils/loggerUtils";
export const login: Handler = async (
  event: APIGatewayEvent,
): Promise<DefaultJsonMessage> => {
  try {
    const { USER_POOL_ID, USER_POOL_CLIENT_ID, error } = validateEvns([
      "USER_POOL_ID",
      "USER_POOL_CLIENT_ID",
    ]);
    if (error) {
      logger.error("Login.handler - ", error);
      return formatDefaultResponse(500, error);
    }

    if (!event.body) {
      return formatDefaultResponse(
        400,
        "Parâmetros de entradas não encontrados",
      );
    }
    const request = JSON.parse(event.body);
    const { login, password } = request as LoginResponse;
    if (!login || !login.match(emailRegex)) {
      return formatDefaultResponse(400, "Email inválido");
    }
    if (!password || !password.match(passwordRegex)) {
      return formatDefaultResponse(400, "Senha inválido");
    }
    logger.info("Login.handler - start", login);
    const response = await new CognitoServices(
      USER_POOL_ID,
      USER_POOL_CLIENT_ID,
    ).login(login, password);
    logger.debug("Login.handler - cognito response:", response);
    logger.info("Login.handler - finish", login);
    return formatDefaultResponse(200, undefined, response);
  } catch (err) {
    logger.error("Login.handler - Error on login user:", err);
    return formatDefaultResponse(500, "erro ao autenticar usuário");
  }
};
