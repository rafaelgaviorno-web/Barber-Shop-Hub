import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, stockMovementsTable } from "@workspace/db/schema";
import { eq, and, lte, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/products", requireAuth, async (req, res) => {
  const barbershopId = req.query.barbershopId ? parseInt(String(req.query.barbershopId)) : undefined;
  const where = barbershopId ? eq(productsTable.barbershopId, barbershopId) : undefined;
  const products = await db.select().from(productsTable).where(where).orderBy(desc(productsTable.createdAt));
  res.json(products);
});

router.get("/products/low-stock", requireAuth, async (req, res) => {
  const barbershopId = req.query.barbershopId ? parseInt(String(req.query.barbershopId)) : undefined;
  const query = db.select().from(productsTable);
  const products = barbershopId
    ? await query.where(and(eq(productsTable.barbershopId, barbershopId), lte(productsTable.quantity, productsTable.minQuantity)))
    : await query.where(lte(productsTable.quantity, productsTable.minQuantity));
  res.json(products);
});

router.get("/products/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!product) return res.status(404).json({ error: "Produto não encontrado" });
  res.json(product);
});

router.post("/products", requireAuth, async (req, res) => {
  const { name, description, costPrice, salePrice, quantity, minQuantity, unit, category, barbershopId } = req.body;
  const [product] = await db.insert(productsTable).values({
    name,
    description,
    costPrice: costPrice ?? 0,
    salePrice,
    quantity: quantity ?? 0,
    minQuantity: minQuantity ?? 5,
    unit: unit ?? "un",
    category: category ?? "Geral",
    barbershopId,
  }).returning();
  if (quantity && quantity > 0) {
    await db.insert(stockMovementsTable).values({
      productId: product.id,
      barbershopId: product.barbershopId,
      quantity,
      type: "entrada",
      description: "Estoque inicial",
    });
  }
  res.status(201).json(product);
});

router.put("/products/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const { name, description, costPrice, salePrice, quantity, minQuantity, unit, category } = req.body;
  const [product] = await db.update(productsTable)
    .set({ name, description, costPrice, salePrice, quantity, minQuantity, unit, category, updatedAt: new Date() })
    .where(eq(productsTable.id, id))
    .returning();
  if (!product) return res.status(404).json({ error: "Produto não encontrado" });
  res.json(product);
});

router.delete("/products/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id));
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.status(204).end();
});

router.get("/products/:id/movements", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const movements = await db.select().from(stockMovementsTable)
    .where(eq(stockMovementsTable.productId, id))
    .orderBy(desc(stockMovementsTable.createdAt));
  res.json(movements);
});

router.post("/products/:id/movements", requireAuth, async (req, res) => {
  const productId = parseInt(String(req.params.id));
  const { quantity, type, description } = req.body;

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!product) return res.status(404).json({ error: "Produto não encontrado" });

  const delta = type === "saida" ? -Math.abs(quantity) : Math.abs(quantity);
  const newQty = product.quantity + delta;
  if (newQty < 0) return res.status(400).json({ error: "Estoque insuficiente" });

  await db.update(productsTable).set({ quantity: newQty, updatedAt: new Date() }).where(eq(productsTable.id, productId));

  const [movement] = await db.insert(stockMovementsTable).values({
    productId,
    barbershopId: product.barbershopId,
    quantity,
    type,
    description,
  }).returning();

  res.status(201).json(movement);
});

export default router;
