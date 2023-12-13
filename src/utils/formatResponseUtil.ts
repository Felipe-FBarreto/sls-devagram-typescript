import type { DefaultResponseMessage } from "../types/DefaultResponseMessage";

export type DefaultJsonMessage = {
  statusCode: number;
  headers: object;
  body: string;
};

export const formatDefaultResponse = (
  statusCode: number,
  message: string | undefined,
  response?: Record<string, unknown>,
): DefaultJsonMessage => {
  const defaultMessage: DefaultResponseMessage = {};

  if (message && statusCode >= 200 && statusCode <= 399) {
    defaultMessage.message = message;
  } else if (message) {
    defaultMessage.error = message;
  }

  return {
    statusCode,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(response || defaultMessage),
  };
};
