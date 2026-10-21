const express = require("express");
const router = express.Router();
const postsRouter = require("./posts.routes");
const requestsRouter = require("./requests.routes");
const quotesActionsRouter = require("./quotes.actions.routes");
const ordersRouter = require("./orders.routes");
const authRouter = require("./auth.routes");

router.use("/requests", requestsRouter);
router.use("/quotes", quotesActionsRouter);
router.use("/orders", ordersRouter);
router.use("/auth", authRouter);
router.use("/posts", postsRouter);


module.exports = router;