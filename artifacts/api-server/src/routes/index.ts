import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import barbershopsRouter from "./barbershops";
import barbersRouter from "./barbers";
import servicesRouter from "./services";
import appointmentsRouter from "./appointments";
import salesRouter from "./sales";
import expensesRouter from "./expenses";
import commissionsRouter from "./commissions";
import reportsRouter from "./reports";
import productsRouter from "./products";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/barbershops", barbershopsRouter);
router.use(barbersRouter);
router.use(servicesRouter);
router.use("/appointments", appointmentsRouter);
router.use("/sales", salesRouter);
router.use("/expenses", expensesRouter);
router.use("/commissions", commissionsRouter);
router.use("/reports", reportsRouter);
router.use(productsRouter);
router.use(notificationsRouter);

export default router;
