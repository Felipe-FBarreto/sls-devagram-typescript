import { getUserIdFromEvent } from "./../utils/authenticationHandlerUtils";
import { Handler, APIGatewayEvent } from "aws-lambda";

import {
  DefaultJsonMessage,
  formatDefaultResponse,
} from "../utils/formatResponseUtil";
import { UserModel } from "../models/UserModels";
import { S3Service } from "../services/S3Services";

export const me: Handler = async (
  event: APIGatewayEvent,
): Promise<DefaultJsonMessage> => {
  try {
    const { USER_TABLE, AVATAR_BUCKET } = process.env;
    if (!USER_TABLE || !AVATAR_BUCKET) {
      return formatDefaultResponse(
        500,
        "Environments para dynamo e s3 não encontradas",
      );
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
