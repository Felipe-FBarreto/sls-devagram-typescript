import { PostModel } from "./../models/PostModels";
import { Handler } from "aws-lambda";
import { UserModel } from "../models/UserModels";
import { S3Service } from "../services/S3Services";
import { DefaultListPaginated } from "../types/DefaultListPaginated";
import {
  DefaultJsonMessage,
  formatDefaultResponse,
} from "../utils/formatResponseUtil";
import { validateEvns } from "../utils/validadeEnvs";
import { getUserIdFromEvent } from "../utils/authenticationHandlerUtils";
import { LastKeyResponseFeed } from "../types/LastKeyResponseFeed";

export const findByUserId: Handler = async (
  event: any,
): Promise<DefaultJsonMessage> => {
  try {
    const { error, POST_BUCKET } = validateEvns([
      "USER_TABLE",
      "POST_TABLE",
      "POST_BUCKET",
    ]);
    if (error) {
      return formatDefaultResponse(500, error);
    }
    const { userId } = event.pathParameters || {
      userId: getUserIdFromEvent(event),
    };

    if (!userId) {
      return formatDefaultResponse(400, "Usuário não encontrado");
    }

    const user = await UserModel.get({ cognitoId: userId });

    if (!user) {
      return formatDefaultResponse(400, "Usuário não encontrado");
    }
    const query = PostModel.query({ userId: userId }).sort("descending");

    const lastKey = (event.queryStringParameters ||
      null) as LastKeyResponseFeed;

    if (lastKey) {
      query.startAt(lastKey);
    }
    const result = await query.limit(20).exec();

    const response = {} as DefaultListPaginated;

    if (result) {
      response.count = result.count;
      response.lastyKey = result.lastKey;

      for (const post of result) {
        if (post && post.image) {
          post.image = await new S3Service().getImageUrl(
            POST_BUCKET,
            post.image,
          );
        }
        response.data = result;
      }
    }
    return formatDefaultResponse(200, undefined, response);
  } catch (e) {
    console.log("Error: " + e);
    return formatDefaultResponse(500, "Erro buscar publicação:" + e);
  }
};

export const feedHome: Handler = async (
  event: any,
): Promise<DefaultJsonMessage> => {
  try {
    const { error, POST_BUCKET } = validateEvns([
      "USER_TABLE",
      "POST_TABLE",
      "POST_BUCKET",
    ]);
    if (error) {
      return formatDefaultResponse(500, error);
    }
    const userId = getUserIdFromEvent(event);

    if (!userId) {
      return formatDefaultResponse(400, "Usuário não encontrado");
    }

    const user = await UserModel.get({ cognitoId: userId });

    if (!user) {
      return formatDefaultResponse(400, "Usuário não encontrado");
    }

    const usersToFeed = user.following;
    usersToFeed.push(userId);
    const query = PostModel.scan("userId").in(usersToFeed);

    const lastKey = event.queryStringParameters || "";

    if (lastKey) {
      query.startAt({ id: lastKey });
    }
    const result = await query.limit(20).exec();

    const response = {} as DefaultListPaginated;

    if (result) {
      response.count = result.count;
      response.lastyKey = result.lastKey;

      for (const post of result) {
        if (post && post.image) {
          post.image = await new S3Service().getImageUrl(
            POST_BUCKET,
            post.image,
          );
        }
        response.data = result;
      }
    }
    return formatDefaultResponse(200, undefined, response);
  } catch (e) {
    console.log("Error: " + e);
    return formatDefaultResponse(500, "Erro buscar publicação:" + e);
  }
};
