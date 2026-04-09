import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import onboardingRouter from "./onboarding";
import kycRouter from "./kyc";
import accountsRouter from "./accounts";
import cardsRouter from "./cards";
import paymentsRouter from "./payments";
import fxRouter from "./fx";
import notificationsRouter from "./notifications";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(onboardingRouter);
router.use(kycRouter);
router.use(accountsRouter);
router.use(cardsRouter);
router.use(paymentsRouter);
router.use(fxRouter);
router.use(notificationsRouter);
router.use(dashboardRouter);

export default router;
