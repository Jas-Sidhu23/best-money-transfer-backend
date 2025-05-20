var express           = require("express");
const router          = express.Router();
const controller      = require("./controller");
//const uploadFile = require("./middlewares/multer")
const { uploadFile, convertBase64ToFile } = require("./middlewares/multer.js");
const { countReset } = require("console");
const { isAuthenticatedUser } = require("./middlewares/auth.js");
//router.post('/uploadFile64',convertBase64ToFile,uploadFile.single('file'), isAuthenticatedUser, controller.upload)
// router.post("/login",controller.login)

router.post("/register", controller.registration);
router.post("/registration-verification", controller.verifyRegistrationOTP);
router.post("/login", controller.login);
router.post("/email-verification", controller.verifyEmailOTP);
router.post("/forgot-password", controller.forgotPassword);
router.post("/forgot-password-verification", controller.verifyForgotPw);
router.post("/change-password", controller.changePassword);
router.post("/add-card", /*isAuthenticatedUser,*/ controller.addCard);
router.post("/get-cards", controller.getCards);
router.post("/get-card", controller.getCard);
router.post("/edit-card", controller.editCard);
router.post("/delete-card", controller.deleteCard);
router.post("/get-user", controller.getUser);
router.post("/complete-profile", convertBase64ToFile, controller.completeProfile);
router.post("/search", controller.searchBMTP_id);
router.post("/transfer-verification", controller.verifyTransaction);
router.post("/add-to-wallet", controller.addToWallet);
router.post("/wallet-transfer-transaction", controller.wtTransaction);
router.post("/delete-transaction", controller.deleteTransaction);
router.post("/get-transaction", controller.getTransaction);
router.post("/wallet-balance-transfer", controller.walletTransfer);
router.post("/get-recent-activity", controller.getRecentActivity);
// router.post("hello", controller.forgotPassword)
module.exports = router;