/** Read the server port from the environment, falling back to a default. */
export function getPort(defaultPort: number): number {
  const value = process.env.PORT;
  const parsed = value ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : defaultPort;
}
