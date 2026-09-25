const userMiddleware = (req, res, next) => {
  if (req.user?.role !== "user") {
    return res
      .status(403)
      .json({ message: "This action is available to normal users only." });
  }
  next();
};

module.exports = userMiddleware;
// this is sheild between admin and user