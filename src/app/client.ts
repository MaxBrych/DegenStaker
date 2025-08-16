import { createThirdwebClient } from "thirdweb";

// Replace this with your client ID string
// refer to https://portal.thirdweb.com/typescript/v5/client on how to get a client ID
const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

export const client = createThirdwebClient({
  clientId: clientId || "28a86378d98182486738ba1d1e8e56f0",
});
