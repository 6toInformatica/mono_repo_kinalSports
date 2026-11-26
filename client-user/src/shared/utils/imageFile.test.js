import { imageAssetError } from "./imageFile.js";

describe("imageAssetError", () => {
  it("acepta una foto vacía y un jpg dentro del límite", () => {
    expect(imageAssetError(null)).toBeNull();
    expect(
      imageAssetError({ mimeType: "image/jpeg", fileSize: 1024 }),
    ).toBeNull();
  });

  it("rechaza formato y tamaño antes de armar la petición", () => {
    expect(imageAssetError({ mimeType: "image/gif", fileSize: 100 })).toMatch(
      /Formato/,
    );
    expect(
      imageAssetError({ uri: "foto.png", fileSize: 11 * 1024 * 1024 }),
    ).toMatch(/10 MB/);
  });
});
