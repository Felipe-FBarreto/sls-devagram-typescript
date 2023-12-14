import { ConfirmUserEmailRequest } from "./../types/auth/ConfirmUserEmailRequest";
import { CognitoServices } from "./../services/CognitoServices";
import { emailRegex, passwordRegex } from "../contents/Regexes";
import { UserResgisterRequest } from "../types/auth/UserResgisterRequest";
import {
  DefaultJsonMessage,
  formatDefaultResponse,
} from "./../utils/formatResponseUtil";
import type { Handler, APIGatewayEvent } from "aws-lambda";
import { User } from "../types/models/User";
import { UserModel } from "../models/UserModels";

export const register: Handler = async (
  event: APIGatewayEvent,
): Promise<DefaultJsonMessage> => {
  try {
    const { USER_POOL_ID, USER_POOL_CLIENT_ID, USER_TABLE } = process.env;
    if (!USER_POOL_ID || !USER_POOL_CLIENT_ID) {
      return formatDefaultResponse(500, "Cognito Environments não encontradas");
    }
    if (!USER_TABLE) {
      return formatDefaultResponse(
        500,
        " ENV da tabela do dynamo não informada",
      );
    }
    if (!event.body) {
      return formatDefaultResponse(
        401,
        "Parametros necessários não informados",
      );
    }
    const request = JSON.parse(event.body);
    const { email, name, password } = request as UserResgisterRequest;

    if (!email || !email.match(emailRegex)) {
      return formatDefaultResponse(401, "Email inváido");
    }
    if (!password || !password.match(passwordRegex)) {
      return formatDefaultResponse(401, "Senha inváido");
    }
    if (!name || name.trim().length < 2) {
      return formatDefaultResponse(401, "Nome inváido");
    }
    const cognitoUser = await new CognitoServices(
      USER_POOL_ID,
      USER_POOL_CLIENT_ID,
    ).singUp(email, password);

    const user: User = {
      name,
      email,
      cognitoId: cognitoUser.userSub,
    };
    await UserModel.create(user);
    return formatDefaultResponse(200, "Usuário cadastrado com sucesso");
  } catch (e) {
    return formatDefaultResponse(500, "Erro ao cadastrar usuário:" + e);
  }
};

export const confirmEmail: Handler = async (
  event: APIGatewayEvent,
): Promise<DefaultJsonMessage> => {
  try {
    const { USER_POOL_ID, USER_POOL_CLIENT_ID } = process.env;
    if (!USER_POOL_ID || !USER_POOL_CLIENT_ID) {
      return formatDefaultResponse(500, "Cognito Environments não encontradas");
    }
    if (!event.body) {
      return formatDefaultResponse(
        401,
        "Parametros necessários não informados",
      );
    }

    const request = JSON.parse(event.body);

    const { code, email } = request as ConfirmUserEmailRequest;

    if (!email || !email.match(emailRegex)) {
      return formatDefaultResponse(401, "Email inváido");
    }
    if (!code || code.length !== 6) {
      return formatDefaultResponse(401, "Código inváido");
    }
    await new CognitoServices(USER_POOL_ID, USER_POOL_CLIENT_ID).confirmEmail(
      code,
      email,
    );
    return formatDefaultResponse(200, "Cadastro confirmado com sucesso");
  } catch (e) {
    return formatDefaultResponse(500, "Erro ao confirmar usuário:" + e);
  }
};
