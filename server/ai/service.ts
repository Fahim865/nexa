import { parseAiRequest } from "./contracts";
import { getAiProvider } from "./provider";

export async function runAiRequest(input: unknown) {
  const request = parseAiRequest(input);
  return getAiProvider().generate(request);
}
