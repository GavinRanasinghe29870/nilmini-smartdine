const AI_MENU_SERVICE_URL = (
  process.env.AI_MENU_SERVICE_URL || "http://localhost:5005"
).replace(/\/$/, "");

async function reduceTodayMenuStockForOrder(order) {
  const payload = {
    orderId: String(order._id || order.id || ""),
    orderNumber: order.orderNumber || "",
    items: (order.items || []).map((item) => ({
      productId: String(item.productId || ""),
      productName: item.productName || "",
      categoryName: item.categoryName || "",
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
    })),
  };

  const response = await fetch(
    `${AI_MENU_SERVICE_URL}/api/ai-menu/today/consume-stock`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = {
      success: false,
      message: text || "AI menu service returned non-JSON response",
    };
  }

  if (!response.ok || data?.success === false) {
    throw new Error(
      data?.message ||
        data?.error ||
        "Failed to reduce Today Menu stock after payment"
    );
  }

  return data;
}

module.exports = {
  reduceTodayMenuStockForOrder,
};