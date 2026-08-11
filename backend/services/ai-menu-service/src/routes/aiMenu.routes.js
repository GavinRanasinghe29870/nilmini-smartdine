const router = require("express").Router();

const aiMenuController = require("../controllers/aiMenu.controller");
const {
  consumeTodayMenuStock,
} = require("../controllers/aiMenuStock.controller");

router.post("/generate", aiMenuController.generateMenu);
router.get("/", aiMenuController.getGeneratedMenus);
router.get("/today", aiMenuController.getTodayMenu);

router.patch("/today/consume-stock", consumeTodayMenuStock);

router.patch("/:id/approve", aiMenuController.approveGeneratedMenu);

module.exports = router;