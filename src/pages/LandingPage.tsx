import { useState, useEffect, useCallback } from "react";
import type { Dessert, CartItem } from "../types/cart";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";
import {
  fetchProducts,
  getCart,
  addToCartAPI,
  removeCartItemAPI,
  clearCartAPI,
  placeOrder,
} from "../api";

// Fallback static data used when backend is unreachable
const FALLBACK_DESSERTS: Dessert[] = [
  { id: 1, name: "Pistachio Baklava", category: "Baklava", price: 4, image: "/image-baklava-desktop.jpg", description: "Delicious pistachio baklava", inStock: true },
  { id: 2, name: "Waffle with Berries", category: "Waffle", price: 6.5, image: "/image-waffle-tablet.jpg", description: "Tasty waffle with fresh berries", inStock: true },
  { id: 3, name: "Classic Tiramisu", category: "Tiramisu", price: 5.5, image: "/image-tiramisu-tablet.jpg", description: "Creamy classic tiramisu", inStock: true },
  { id: 4, name: "Vanilla Panna Cotta", category: "Panna Cotta", price: 6.5, image: "/image-panna-cotta-desktop.jpg", description: "Smooth vanilla panna cotta", inStock: true },
  { id: 5, name: "Meringue with Berries", category: "Meringue", price: 5.5, image: "/image-meringue-tablet.jpg", description: "Light meringue with berries", inStock: true },
  { id: 6, name: "Macaron Mix of Five", category: "Macaron", price: 8, image: "/image-macaron-tablet.jpg", description: "Colorful macarons mix", inStock: true },
  { id: 7, name: "Crème Brûlée", category: "Crème Brûlée", price: 7, image: "/image-creme-brulee-desktop.jpg", description: "Classic French crème brûlée", inStock: true },
  { id: 8, name: "Lemon Meringue Cake", category: "Cake", price: 5, image: "/image-cake-desktop.jpg", description: "Zesty lemon meringue cake", inStock: true },
  { id: 9, name: "Salted Caramel Brownie", category: "Brownie", price: 3.5, image: "/image-brownie-mobile.jpg", description: "Rich salted caramel brownie", inStock: true },
];

function LandingPage() {
  const { user, logout } = useAuth();

  const [desserts, setDesserts] = useState<Dessert[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loadingCart, setLoadingCart] = useState(false);

  // ── Load products from backend, fall back to static data ──────────────────
  useEffect(() => {
    fetchProducts()
      .then((res) => {
        const products: Dessert[] = res.data.data.map((p: any) => ({
          id: p._id,
          name: p.name,
          category: p.categoryId?.name ?? p.categoryId ?? "Dessert",
          price: p.price,
          image: p.images?.[0] ?? "/image-baklava-desktop.jpg",
          description: p.description ?? "",
          inStock: p.inStock,
        }));
        setDesserts(products.length ? products : FALLBACK_DESSERTS);
      })
      .catch(() => setDesserts(FALLBACK_DESSERTS));
  }, []);

  // ── Load backend cart when user logs in ───────────────────────────────────
  const syncCart = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingCart(true);
      const res = await getCart();
      const backendItems: CartItem[] = (res.data.items ?? []).map((i: any) => ({
        dessert: {
          id: i.productId?._id ?? i.productId,
          name: i.productId?.name ?? "Item",
          category: i.productId?.categoryId ?? "Dessert",
          price: i.productId?.price ?? 0,
          image: i.productId?.images?.[0] ?? "/image-baklava-desktop.jpg",
          description: i.productId?.description ?? "",
          inStock: i.productId?.inStock ?? true,
        },
        quantity: i.quantity,
        addedAt: new Date(),
      }));
      setCart(backendItems);
    } catch {
      // keep local cart on error
    } finally {
      setLoadingCart(false);
    }
  }, [user]);

  useEffect(() => {
    syncCart();
  }, [syncCart]);

  // ── Add to cart ───────────────────────────────────────────────────────────
  const addToCart = async (dessert: Dessert) => {
    // Optimistic local update
    setCart((prev) => {
      const exists = prev.find((item) => item.dessert.id === dessert.id);
      if (exists)
        return prev.map((item) =>
          item.dessert.id === dessert.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      return [...prev, { dessert, quantity: 1, addedAt: new Date() }];
    });

    if (user) {
      try {
        await addToCartAPI(String(dessert.id), 1);
      } catch {
        // revert on failure
        setCart((prev) =>
          prev
            .map((item) =>
              item.dessert.id === dessert.id
                ? { ...item, quantity: item.quantity - 1 }
                : item
            )
            .filter((item) => item.quantity > 0)
        );
      }
    }
  };

  // ── Remove / decrement from cart ──────────────────────────────────────────
  const removeFromCart = async (dessertId: number | string) => {
    const prev = [...cart];
    setCart((c) =>
      c
        .map((item) =>
          item.dessert.id === dessertId
            ? { ...item, quantity: Math.max(item.quantity - 1, 0) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );

    if (user) {
      try {
        await removeCartItemAPI(String(dessertId));
      } catch {
        setCart(prev);
      }
    }
  };

  // ── Confirm order ─────────────────────────────────────────────────────────
  const confirmOrder = async () => {
    if (user) {
      try {
        await placeOrder({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        });
        await clearCartAPI();
      } catch {
        // show modal anyway; order may still have been placed
      }
    }
    setShowModal(true);
  };

  const startNewOrder = () => {
    setCart([]);
    setShowModal(false);
  };

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const orderTotal = cart.reduce(
    (s, i) => s + i.quantity * i.dessert.price,
    0
  );
  const getQuantity = (id: number | string) =>
    cart.find((c) => c.dessert.id === id)?.quantity ?? 0;

  return (
    <div className="w-full min-h-screen bg-orange-50">
      {/* ── Navbar ── */}
      <nav className="flex justify-between items-center px-6 py-4 bg-white shadow-sm">
        <h1 className="text-red-400 font-extrabold text-2xl tracking-tight">
          🍰 Dessert Shop
        </h1>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-gray-600">
                Hi, {user.firstName}!
              </span>
              <button
                onClick={logout}
                className="text-sm text-red-400 font-semibold border border-red-300 px-3 py-1 rounded-full hover:bg-red-50"
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="text-sm bg-red-400 text-white font-semibold px-4 py-1.5 rounded-full hover:bg-red-500"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      <div className="grid grid-cols-[2fr_1fr] gap-6 p-6">
        {/* ── Desserts grid ── */}
        <div className="flex flex-col gap-6">
          <h2 className="text-gray-700 font-bold text-2xl">Desserts</h2>
          <div className="grid grid-cols-3 gap-4">
            {desserts.map((dessert) => (
              <div
                key={dessert.id}
                className="rounded-lg shadow-lg bg-white overflow-hidden"
              >
                <img
                  src={dessert.image}
                  alt={dessert.name}
                  className="w-full h-43 object-cover rounded-lg"
                />
                <div className="flex -mt-5 justify-center">
                  <div
                    className="flex items-center gap-2 bg-white border border-gray-500 text-md font-medium text-gray-800 px-5 py-2 rounded-full shadow-md cursor-pointer"
                    onMouseEnter={() => setHoveredId(Number(dessert.id))}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {hoveredId === Number(dessert.id) ? (
                      <>
                        <button
                          onClick={() => removeFromCart(dessert.id)}
                          className="px-2 py-1 bg-gray-200 rounded"
                        >
                          -
                        </button>
                        <span>{getQuantity(dessert.id)}</span>
                        <button onClick={() => addToCart(dessert)}>+</button>
                      </>
                    ) : (
                      <button
                        onClick={() => addToCart(dessert)}
                        className="flex items-center gap-2"
                      >
                        <img
                          src="/icon-add-to-cart.svg"
                          alt="Add to cart"
                          className="w-4 h-4"
                        />
                        Add to cart
                      </button>
                    )}
                  </div>
                </div>
                <div className="pt-4 px-3 pb-4 text-left">
                  <p className="text-xs text-gray-400">{dessert.category}</p>
                  <h3 className="text-sm font-semibold text-gray-800">
                    {dessert.name}
                  </h3>
                  <p className="text-orange-600 font-semibold">
                    ${dessert.price.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Cart ── */}
        <div className="flex items-start justify-center">
          <div className="rounded-lg shadow-lg bg-white w-full max-w-sm h-fit flex flex-col">
            <h4 className="text-red-400 font-bold text-2xl text-left p-4">
              Your Cart ({totalItems})
            </h4>

            {loadingCart ? (
              <p className="text-center text-gray-400 p-4 text-sm">
                Loading cart…
              </p>
            ) : cart.length === 0 ? (
              <>
                <img
                  src="/illustration-empty-cart.svg"
                  alt="Empty cart"
                  className="w-24 h-24 m-auto"
                />
                <p className="text-gray-400 text-sm text-center p-4">
                  Your added items will appear here
                </p>
              </>
            ) : (
              <div className="flex flex-col gap-2 p-4">
                {cart.map((item) => (
                  <div
                    key={item.dessert.id}
                    className="flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold text-sm">
                        {item.dessert.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.quantity}x @ ${item.dessert.price.toFixed(2)} = $
                        {(item.quantity * item.dessert.price).toFixed(2)}
                      </p>
                    </div>
                    <button onClick={() => removeFromCart(item.dessert.id)}>
                      <img
                        src="/icon-remove-item.svg"
                        alt="Remove"
                        className="w-4 h-4"
                      />
                    </button>
                  </div>
                ))}
                <div className="border-t mt-2 pt-2 flex justify-between font-bold text-lg">
                  <span>Order Total</span>
                  <span>${orderTotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            {cart.length > 0 && (
              <button
                onClick={confirmOrder}
                className="bg-red-400 text-white font-bold py-3 m-4 rounded-xl hover:bg-red-500"
              >
                Confirm Order
              </button>
            )}

            {!user && cart.length > 0 && (
              <p className="text-xs text-center text-gray-400 pb-3">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="text-red-400 underline"
                >
                  Sign in
                </button>{" "}
                to save your cart & track orders
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Order confirmed modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-sm">
                ✓
              </div>
              <h2 className="text-xl font-bold">Order Confirmed</h2>
            </div>
            <p className="text-gray-500 mb-4">We hope you enjoy your food!</p>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {cart.map((item) => (
                <div
                  key={item.dessert.id}
                  className="flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-sm">{item.dessert.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.quantity}x @ ${item.dessert.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold">
                    ${(item.quantity * item.dessert.price).toFixed(2)}
                  </p>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>Order Total</span>
                <span>${orderTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={startNewOrder}
              className="w-full bg-red-400 text-white font-bold py-3 rounded-xl mt-6 hover:bg-red-500"
            >
              Start New Order
            </button>
          </div>
        </div>
      )}

      {/* ── Auth modal ── */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}

export default LandingPage;
