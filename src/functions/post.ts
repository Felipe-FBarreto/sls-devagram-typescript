import { PostModel } from "./../models/PostModels";
import { getUserIdFromEvent } from "../utils/authenticationHandlerUtils";
import { Handler, APIGatewayEvent } from "aws-lambda";
import * as Uuid from "uuid";
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
import { IPost } from "../types/models/Post";

type EventUpdatePostResponse = {
  description?: string;
  file?: FileData;
};
export const post: Handler = async (
  event: APIGatewayEvent,
): Promise<DefaultJsonMessage> => {
  try {
    const { POST_BUCKET, error } = validateEvns(["POST_BUCKET"]);
    if (error) {
      return formatDefaultResponse(
        500,
        "Environment de table ou bucket não encontradas",
      );
    }

    const userId = getUserIdFromEvent(event);

    if (!userId) {
      return formatDefaultResponse(400, "Usuário não encontrado ");
    }

    const user = await UserModel.get({ cognitoId: userId });
    if (!user) {
      return formatDefaultResponse(400, "Usuário não encontrado");
    }
    const formatData = parse(event, true);
    const { description, file } = formatData as EventUpdatePostResponse;
    if (!description && !file) {
      return formatDefaultResponse(
        400,
        "Parâmetros de entradas não encontrados",
      );
    }
    if (!description || description.trim().length < 5) {
      return formatDefaultResponse(400, "Descrição inválido");
    }
    if (!file || !imageAllowedExtensions.exec(file.filename)) {
      return formatDefaultResponse(400, "Extenão do arquivo não é suportada");
    }
    const imageKey = await new S3Service().saveImageS3(
      POST_BUCKET,
      "post",
      file,
    );
    const currentDate = new Date();
    const post: IPost = {
      id: Uuid.v4(),
      userId,
      description,
      date: currentDate.toString(),
      image: imageKey,
    };
    await PostModel.create(post);
    user.post = user.post + 1;
    await UserModel.update(user);
    return formatDefaultResponse(200, "Publicação feita com sucesso");
  } catch (e) {
    return formatDefaultResponse(500, "Não foi possível realizar a publicação");
  }
};

export const toggleLike: Handler = async (
  event: any,
): Promise<DefaultJsonMessage> => {
  try {
    const { error } = validateEvns(["POST_BUCKET"]);
    if (error) {
      return formatDefaultResponse(
        500,
        "Environment de table ou bucket não encontradas",
      );
    }

    const userId = getUserIdFromEvent(event);

    if (!userId) {
      return formatDefaultResponse(400, "Usuário não encontrado ");
    }

    const { postId } = event.pathParameters;
    if (!postId) {
      return formatDefaultResponse(400, "Parâmetros de entrada não informados");
    }
    const post = await PostModel.get({ id: postId });
    if (!post) {
      return formatDefaultResponse(400, "Publicação não encontrada");
    }
    const hasLiked = post.likes.findIndex((lk) => lk.toString() === userId);

    if (hasLiked != -1) {
      post.likes.splice(hasLiked, 1);
      await PostModel.update(post);
      return formatDefaultResponse(200, "Removido like com sucesso");
    } else {
      post.likes.push(userId);
      await PostModel.update(post);
      return formatDefaultResponse(200, "Like realizado com sucesso");
    }
  } catch (e) {
    return formatDefaultResponse(500, "Não foi possível realizar like");
  }
};
