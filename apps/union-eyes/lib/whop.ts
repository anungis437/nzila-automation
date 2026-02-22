import { WhopAPI } from "@whop-apps/sdk";

// App-level operations (server-side only)
// Only used in server components or server actions
export const whopApp = () => {
  // Securely access API key from environment
  // Never expose this on the client
  const apiKey = process.env.WHOP_API_KEY;
  
  if (!apiKey) {
}
  
  return WhopAPI.app({ apiKey });
};

// Company-level operations (server-side only)
// Only used in server components or server actions
export const whopCompany = () => {
  const apiKey = process.env.WHOP_API_KEY;
  
  if (!apiKey) {
}
  
  return WhopAPI.company({ apiKey });
};

// User-level operations (server-side only)
// Uses the secure headers method for authentication
export const whopMe = (headers: Headers) => {
  return WhopAPI.me({ headers });
}; 
