const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const uploadImageToCloudinary = async (file, options = {}) => {
  const maxSizeInBytes = options.maxSizeInBytes || 2 * 1024 * 1024;

  if (!file?.type?.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  if (file.size > maxSizeInBytes) {
    throw new Error("Image must be less than 2 MB");
  }

  const image = await fileToDataUrl(file);

  const res = await fetch("/api/upload/image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      image,
      folder: options.folder,
    }),
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json()
    : { message: await res.text() };

  if (!res.ok) {
    throw new Error(data?.message || "Cloudinary upload failed");
  }

  return data.url;
};
