/** Hands the browser a file to save. */
export function download(name: string, file: Blob): void {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(file);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}
