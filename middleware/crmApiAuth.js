import crypto from "crypto";

export const crmApiAuth = (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];
    const secretKey = process.env.CRM_API_KEY;

    if (!apiKey || !secretKey) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized API access",
      });
    }

    const provided = Buffer.from(apiKey);
    const expected = Buffer.from(secretKey);

    if (
      provided.length !== expected.length ||
      !crypto.timingSafeEqual(provided, expected)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid API key",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};
