/**
 * Limits shared by the composer (checked before sending) and the route
 * handler (checked again on the server, since the client can't be trusted).
 */

/** Max characters in a single user message. */
export const MAX_MESSAGE_CHARS = 8_000;
