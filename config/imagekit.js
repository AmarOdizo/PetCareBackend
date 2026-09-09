const crypto = require("crypto");
const https = require("https");
const dotenv = require("dotenv");

dotenv.config();

const PUBLIC_KEY = process.env.IMAGEKIT_PUBLIC_KEY || "public_/PfWSDFtqlaMUzirk/U1+hFG5IM=";
const PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY || "private_QugDN74pUlsdvKYLK3h6aydGtTc=";
const URL_ENDPOINT = process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/dios87u67";

/**
 * Generate authentication parameters for client-side direct upload to ImageKit
 */
function getAuthenticationParameters(token, expire) {
  const defaultToken = token || crypto.randomBytes(16).toString("hex");
  const defaultExpire = expire || Math.floor(Date.now() / 1000) + 1800; // 30 mins valid

  const signature = crypto
    .createHmac("sha1", PRIVATE_KEY)
    .update(defaultToken + defaultExpire)
    .digest("hex");

  return {
    token: defaultToken,
    expire: defaultExpire,
    signature: signature,
    publicKey: PUBLIC_KEY,
    urlEndpoint: URL_ENDPOINT
  };
}

/**
 * Upload image (Base64 data string, binary buffer, or remote image URL) directly to ImageKit REST API
 * IMPORTANT: If fileData is a data URI (data:image/...;base64,...), the prefix is automatically stripped.
 * ImageKit's REST API requires raw base64 string or binary — NOT the full data URI.
 */
function uploadImage(fileData, fileName, folder = "/pets") {
  return new Promise((resolve, reject) => {
    if (!fileData) {
      return reject(new Error("File data or image URL is required."));
    }

    // Strip the data URI prefix if present (e.g. "data:image/jpeg;base64,...")
    // ImageKit requires raw base64 string, not the full data URI
    let cleanFileData = fileData;
    if (typeof fileData === "string" && fileData.startsWith("data:")) {
      const commaIndex = fileData.indexOf(",");
      if (commaIndex !== -1) {
        cleanFileData = fileData.substring(commaIndex + 1);
      }
    }

    const name = fileName || "image_" + Date.now() + ".jpg";
    const authHeader = "Basic " + Buffer.from(PRIVATE_KEY + ":").toString("base64");

    const boundary = "----ImageKitBoundary" + Math.random().toString(36).substring(2);

    // Build multipart body as a Buffer for correct binary-safe byte length
    const parts = [];

    parts.push(Buffer.from(
      "--" + boundary + "\r\n" +
      'Content-Disposition: form-data; name="file"\r\n\r\n' +
      cleanFileData + "\r\n", "utf8"
    ));

    parts.push(Buffer.from(
      "--" + boundary + "\r\n" +
      'Content-Disposition: form-data; name="fileName"\r\n\r\n' +
      name + "\r\n", "utf8"
    ));

    parts.push(Buffer.from(
      "--" + boundary + "\r\n" +
      'Content-Disposition: form-data; name="folder"\r\n\r\n' +
      folder + "\r\n", "utf8"
    ));

    parts.push(Buffer.from(
      "--" + boundary + "\r\n" +
      'Content-Disposition: form-data; name="useUniqueFileName"\r\n\r\n' +
      "true\r\n", "utf8"
    ));

    parts.push(Buffer.from("--" + boundary + "--\r\n", "utf8"));

    const bodyBuffer = Buffer.concat(parts);

    const options = {
      hostname: "upload.imagekit.io",
      port: 443,
      path: "/api/v1/files/upload",
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "multipart/form-data; boundary=" + boundary,
        "Content-Length": bodyBuffer.length
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = "";
      res.on("data", (chunk) => responseBody += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(responseBody);
          console.log("[ImageKit Upload] Status:", res.statusCode, "| URL:", json.url || "(none)");
          if (res.statusCode >= 200 && res.statusCode < 300) {
            if (!json.url) {
              return reject(new Error("ImageKit returned success but no CDN URL in response. Raw: " + responseBody));
            }
            resolve(json);
          } else {
            reject(new Error(json.message || "ImageKit upload failed with status " + res.statusCode));
          }
        } catch (e) {
          reject(new Error("Failed to parse ImageKit response: " + responseBody));
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(bodyBuffer);
    req.end();
  });
}

/**
 * Delete file from ImageKit by fileId
 */
function deleteImage(fileId) {
  return new Promise((resolve, reject) => {
    if (!fileId) return reject(new Error("fileId is required"));

    const authHeader = "Basic " + Buffer.from(PRIVATE_KEY + ":").toString("base64");
    const options = {
      hostname: "api.imagekit.io",
      port: 443,
      path: "/v1/files/" + fileId,
      method: "DELETE",
      headers: {
        "Authorization": authHeader
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = "";
      res.on("data", (chunk) => responseBody += chunk);
      res.on("end", () => {
        resolve({ success: res.statusCode === 204 || res.statusCode === 200 });
      });
    });

    req.on("error", (err) => reject(err));
    req.end();
  });
}

module.exports = {
  publicKey: PUBLIC_KEY,
  privateKey: PRIVATE_KEY,
  urlEndpoint: URL_ENDPOINT,
  getAuthenticationParameters,
  uploadImage,
  deleteImage
};
