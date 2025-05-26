export async function getLatestVersion(packageName: string) {
  const response = await fetch(`https://registry.npmjs.org/${packageName}`);
  const data = (await response.json()) as any;
  return data["dist-tags"].latest as string;
}
