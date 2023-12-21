import { getUserIdFromEvent } from "./../utils/authenticationHandlerUtils";
import { Handler, APIGatewayEvent } from "aws-lambda";

import {
  DefaultJsonMessage,
  formatDefaultResponse,
} from "../utils/formatResponseUtil";
import { UserModel } from "../models/UserModels";
import { S3Service } from "../services/S3Services";
import { parse } from "aws-multipart-parser";
import { FileData } from "aws-multipart-parser/dist/models";
import { imageAllowedExtensions } from "../contents/Regexes";
import { validateEvns } from "../utils/validadeEnvs";

export const me: Handler = async (
  event: APIGatewayEvent,
): Promise<DefaultJsonMessage> => {
  try {
    const { AVATAR_BUCKET, error } = validateEvns(["AVATAR_BUCKET"]);
    if (error) {
      return formatDefaultResponse(500, error);
    }
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return formatDefaultResponse(400, "Usuário não encontrado");
    }
    const user = await UserModel.get({ cognitoId: userId });

    if (user && user.avatar) {
      const url = await new S3Service().getImageUrl(AVATAR_BUCKET, user.avatar);
      user.avatar = url;
    }
    return formatDefaultResponse(200, undefined, user);
  } catch (e) {
    return formatDefaultResponse(500, "Erro ao confirmar usuário:" + e);
  }
};

type EventUpdateUserResponse = {
  name?: string;
  file?: FileData;
};
export const updateUser: Handler = async (
  event: APIGatewayEvent,
): Promise<DefaultJsonMessage> => {
  try {
    const { USER_TABLE, AVATAR_BUCKET } = process.env;
    if (!USER_TABLE || !AVATAR_BUCKET) {
      return formatDefaultResponse(
        500,
        "Environment de table ou bucket não encontradas",
      );
    }

    const formatData = parse(event, true) as EventUpdateUserResponse;
    const { name, file } = formatData;
    if (!name && !file) {
      return formatDefaultResponse(
        400,
        "Parâmetros de entradas não encontrados",
      );
    }

    const userId = getUserIdFromEvent(event);

    if (!userId) {
      return formatDefaultResponse(400, "Usuário não encontrado ");
    }

    const user = await UserModel.get({ cognitoId: userId });

    if (name && name.trim().length < 2) {
      return formatDefaultResponse(400, "Nome inválido");
    } else if (name) {
      user.name = name;
    }
    if (file && !imageAllowedExtensions.exec(file.filename)) {
      return formatDefaultResponse(400, "Extenão do arquivo não é suportada");
    } else if (file) {
      const newKey = await new S3Service().saveImageS3(
        AVATAR_BUCKET,
        "avatar",
        file,
      );
      user.avatar = newKey;
    }
    await UserModel.update(user);
    return formatDefaultResponse(200, "Update realizado com sucesso");
  } catch (e) {
    return formatDefaultResponse(
      500,
      "Não foi possível realizar a atualização",
    );
  }
};
