import type { Handler, APIGatewayEvent } from "aws-lambda";
import {
  DefaultJsonMessage,
  formatDefaultResponse,
} from "../utils/formatResponseUtil";
import { LoginResponse } from "../types/LoginResponse";
import { emailRegex, passwordRegex } from "../contents/Regexes";
import { CognitoServices } from "../services/CognitoServices";
export const login: Handler = async (
  event: APIGatewayEvent,
): Promise<DefaultJsonMessage> => {
  try {
    const { USER_POOL_ID, USER_POOL_CLIENT_ID } = process.env;
    if (!USER_POOL_ID || !USER_POOL_CLIENT_ID) {
      return formatDefaultResponse(500, "Coginot Environment não encontrada");
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
    const response = await new CognitoServices(
      USER_POOL_ID,
      USER_POOL_CLIENT_ID,
    ).login(login, password);
    return formatDefaultResponse(200, undefined, response);
  } catch (err) {
    return formatDefaultResponse(500, "erro ao autenticar usuário");
  }
};
