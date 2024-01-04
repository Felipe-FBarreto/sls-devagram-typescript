import { UserModel } from "../models/UserModels";
import { getUserIdFromEvent } from "../utils/authenticationHandlerUtils";
import { validateEvns } from "../utils/validadeEnvs";
import {
  DefaultJsonMessage,
  formatDefaultResponse,
} from "./../utils/formatResponseUtil";
import { Handler } from "aws-lambda";

export const follow: Handler = async (
  event: any,
): Promise<DefaultJsonMessage> => {
  try {
    const { error } = validateEvns(["USER_TABLE"]);
    if (error) {
      return formatDefaultResponse(500, error);
    }
    const { userId } = event.pathParameters;
    const userFollowerId = getUserIdFromEvent(event);

    if (!userId) {
      return formatDefaultResponse(400, "Parametro de url necessario");
    }

    if (userId === userFollowerId) {
      return formatDefaultResponse(400, "Usuário não pode seguir a si mesmo");
    }

    const userFollower = await UserModel.get({ cognitoId: userFollowerId });

    const user = await UserModel.get({ cognitoId: userId });

    if (!user) {
      return formatDefaultResponse(400, "Usuário não encontrado");
    }

    const hasIndex = user.following.findIndex(
      (fl) => fl.toString() === userFollowerId,
    );

    if (hasIndex != -1) {
      user.following.splice(hasIndex, 1);
      userFollower.followers = userFollower.followers - 1;
      await UserModel.update(userFollower);
      await UserModel.update(user);
      return formatDefaultResponse(200, "Você deixou de seguir");
    } else {
      user.following.push(userFollowerId);
      userFollower.followers = userFollower.followers + 1;
      await UserModel.update(userFollower);
      await UserModel.update(user);
      return formatDefaultResponse(200, "Usuario seguido com sucesso");
    }
  } catch (err) {
    console.error(err);
    return formatDefaultResponse(500, "Não foi possível seguir o usuario");
  }
};
