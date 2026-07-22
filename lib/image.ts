/* Turn a dropped/pasted/uploaded image file into a downscaled data URL so it
   is small enough to keep in localStorage and displays anywhere as an <img>.
   Scaling happens on a same-origin blob URL, so the canvas is never tainted. */
export function readImageFile(file: Blob, maxDim = 900, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type || !file.type.startsWith("image/")) {
      reject(new Error("Not an image file"));
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        let { width, height } = img;
        if (!width || !height) {
          reject(new Error("Empty image"));
          return;
        }
        const longest = Math.max(width, height);
        if (longest > maxDim) {
          const scale = maxDim / longest;
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        let out = "";
        try {
          out = canvas.toDataURL("image/webp", quality);
        } catch {
          /* webp unsupported */
        }
        if (!out || out.indexOf("data:image/webp") !== 0) {
          out = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(out);
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Could not process image"));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read that image"));
    };
    img.src = objectUrl;
  });
}
