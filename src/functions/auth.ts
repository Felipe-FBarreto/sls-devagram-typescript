import { ConfirmUserEmailRequest } from "./../types/auth/ConfirmUserEmailRequest";
import { CognitoServices } from "./../services/CognitoServices";
import {
  emailRegex,
  imageAllowedExtensions,
  passwordRegex,
} from "../contents/Regexes";
import { UserResgisterRequest } from "../types/auth/UserResgisterRequest";
import {
  DefaultJsonMessage,
  formatDefaultResponse,
} from "./../utils/formatResponseUtil";
import type { Handler, APIGatewayEvent } from "aws-lambda";
import { User } from "../types/models/User";
import { UserModel } from "../models/UserModels";
import { parse } from "aws-multipart-parser";
import { FileData } from "aws-multipart-parser/dist/models";
import { S3Service } from "../services/S3Services";
import { EventBodyRegister } from "../types/auth/EventBodyRegister";
import { ConfirmPassword } from "../types/auth/confirmPassword";

export const register: Handler = async (
  event: APIGatewayEvent,
): Promise<DefaultJsonMessage> => {
  try {
    const { USER_POOL_ID, USER_POOL_CLIENT_ID, USER_TABLE, AVATAR_BUCKET } =
      process.env;
    if (!USER_POOL_ID || !USER_POOL_CLIENT_ID) {
      return formatDefaultResponse(500, "Cognito Environments não encontradas");
    }
    if (!USER_TABLE) {
      return formatDefaultResponse(
        500,
        " ENV da tabela do dynamo não informada",
      );
    }
    if (!AVATAR_BUCKET) {
      return formatDefaultResponse(
        500,
        " ENV do bucket do avatar não informada",
      );
    }
    if (!event.body) {
      return formatDefaultResponse(
        401,
        "Parametros necessários não informados",
      );
    }
    const formData = parse(event, true) as EventBodyRegister;
    const { name, email, password, file } = formData;

    if (file && !imageAllowedExtensions.exec(file.filename)) {
      return formatDefaultResponse(400, "Extensão do arquivo não suportada");
    }
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
    let key = undefined;
    if (file) {
      key = await new S3Service().saveImageS3(AVATAR_BUCKET, "avatar", file);
    }
    const user: User = {
      name,
      email,
      cognitoId: cognitoUser.userSub,
      avatar: key,
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

export const forgotPassword: Handler = async (
  event: APIGatewayEvent,
): Promise<DefaultJsonMessage> => {
  try {
    const { USER_POOL_ID, USER_POOL_CLIENT_ID } = process.env;
    if (!USER_POOL_ID || !USER_POOL_CLIENT_ID) {
      return formatDefaultResponse(500, "Cognito Environments não encontradas");
    }
    if (!event.body) {
      return formatDefaultResponse(500, "Parâmetros de entrada não informados");
    }
    const request = JSON.parse(event.body);
    const { email } = request;
    if (!email || !email.match(emailRegex)) {
      return formatDefaultResponse(400, "Email inválido");
    }
    await new CognitoServices(USER_POOL_ID, USER_POOL_CLIENT_ID).forgotPassword(
      email,
    );
    return formatDefaultResponse(
      200,
      "Solicitação para recuperar senha enviada com sucesso",
    );
  } catch (err) {
    return formatDefaultResponse(500, "Erro ao recuperar senha:" + err);
  }
};

export const changePassword: Handler = async (
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

    const { code, email, password } = request as ConfirmPassword;

    if (!email || !email.match(emailRegex)) {
      return formatDefaultResponse(401, "Email inváido");
    }
    if (!code || code.length !== 6) {
      return formatDefaultResponse(401, "Código inváido");
    }
    if (!password || !password.match(passwordRegex)) {
      return formatDefaultResponse(400, "Senha inválida");
    }
    await new CognitoServices(
      USER_POOL_ID,
      USER_POOL_CLIENT_ID,
    ).confirmPassword(code, email, password);
    return formatDefaultResponse(200, "Senha alterada com sucesso");
  } catch (e) {
    return formatDefaultResponse(500, "Erro ao confirmar usuário:" + e);
  }
};
