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
import { DefaultListPaginated } from "../types/DefaultListPaginated";

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
    const { AVATAR_BUCKET, error } = validateEvns(["AVATAR_BUCKET"]);
    if (error) {
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
    return formatDefaultResponse(200, "Atualização realizado com sucesso");
  } catch (e) {
    return formatDefaultResponse(
      500,
      "Não foi possível realizar a atualização",
    );
  }
};

export const getUserById: Handler = async (
  event: any,
): Promise<DefaultJsonMessage> => {
  try {
    const { AVATAR_BUCKET, error } = validateEvns([
      "AVATAR_BUCKET",
      "USER_TABLE",
    ]);
    if (error) {
      return formatDefaultResponse(500, error);
    }
    const { userId } = event.pathParameters;

    if (!userId) {
      return formatDefaultResponse(400, "Usuário existe");
    }
    const user = await UserModel.get({ cognitoId: userId });

    if (!user) {
      return formatDefaultResponse(400, "Usuário existe");
    }

    if (user && user.avatar) {
      const url = await new S3Service().getImageUrl(AVATAR_BUCKET, user.avatar);
      user.avatar = url;
    }

    return formatDefaultResponse(200, undefined, user);
  } catch (e) {
    return formatDefaultResponse(500, "Erro buscar usuário por id:" + e);
  }
};

export const searchUser: Handler = async (
  event: any,
): Promise<DefaultJsonMessage> => {
  try {
    const { AVATAR_BUCKET, error } = validateEvns([
      "AVATAR_BUCKET",
      "USER_TABLE",
    ]);
    if (error) {
      return formatDefaultResponse(500, error);
    }
    const { filter } = event.pathParameters;

    if (!filter || filter.length < 2) {
      return formatDefaultResponse(400, "Filtro inválido");
    }

    const { lastKey } = event.queryStringParameters || "";

    const query = UserModel.scan()
      .where("name")
      .contains(filter)
      .or()
      .where("email")
      .contains(filter);

    if (lastKey) {
      query.startAt({ cognitoId: lastKey });
    }
    const result = await query.limit(2).exec();

    const response = {} as DefaultListPaginated;

    if (result) {
      response.lastyKey = result.lastyKey;
      response.count = result.count;

      for (const document of result) {
        if (document && document.avatar) {
          document.avatar = await new S3Service().getImageUrl(
            AVATAR_BUCKET,
            document.avatar,
          );
        }
      }
      response.data = result;
    }
    return formatDefaultResponse(200, undefined, response);
  } catch (e) {
    return formatDefaultResponse(500, "Erro buscar usuário:" + e);
  }
};
