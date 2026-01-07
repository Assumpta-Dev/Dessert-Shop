import { useState } from "react";
import type { Dessert, CartItem } from "../types/cart";

// All 9 desserts from your code
const dessertsData: Dessert[] = [
  {
    id: 1,
    name: "Pistachio Baklava",
    category: "Baklava",
    price: 4,
    image: "/public/image-baklava-desktop.jpg",
    description: "Delicious pistachio baklava",
    inStock: true,
  },
  {
    id: 2,
    name: "Waffle with Berries",
    category: "Waffle",
    price: 6.5,
    image: "/public/image-waffle-tablet.jpg",
    description: "Tasty waffle with fresh berries",
    inStock: true,
  },
  {
    id: 3,
    name: "Classic Tiramisu",
    category: "Tiramisu",
    price: 5.5,
    image: "/public/image-tiramisu-tablet.jpg",
    description: "Creamy classic tiramisu",
    inStock: true,
  },
  {
    id: 4,
    name: "Vanilla Panna Cotta",
    category: "Panna Cotta",
    price: 6.5,
    image: "/public/image-panna-cotta-desktop.jpg",
    description: "Smooth vanilla panna cotta",
    inStock: true,
  },
  {
    id: 5,
    name: "Meringue with Berries",
    category: "Meringue",
    price: 5.5,
    image: "/public/image-meringue-tablet.jpg",
    description: "Light meringue with berries",
    inStock: true,
  },
  {
    id: 6,
    name: "Macaron Mix of Five",
    category: "Macaron",
    price: 8,
    image: "/public/image-macaron-tablet.jpg",
    description: "Colorful macarons mix",
    inStock: true,
  },
  {
    id: 7,
    name: "Classic Tiramisu",
    category: "Tiramisu",
    price: 5.5,
    image: "/public/image-tiramisu-tablet.jpg",
    description: "Creamy classic tiramisu",
    inStock: true,
  },
  {
    id: 8,
    name: "Waffle with Berries",
    category: "Waffle",
    price: 6.5,
    image: "/public/image-waffle-tablet.jpg",
    description: "Tasty waffle with fresh berries",
    inStock: true,
  },
  {
    id: 9,
    name: "Salted Caramel Brownie",
    category: "Brownie",
    price: 3.5,
    image: "/public/image-brownie-mobile.jpg",
    description: "Rich salted caramel brownie",
    inStock: true,
  },
];

function LandingPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // Increase quantity
  const addToCart = (dessert: Dessert) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.dessert.id === dessert.id);
      if (exists) {
        return prev.map((item) =>
          item.dessert.id === dessert.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { dessert, quantity: 1, addedAt: new Date() }];
      }
    });
  };

  // Decrease quantity (cannot go below 0)
  const removeFromCart = (dessertId: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.dessert.id === dessertId
            ? { ...item, quantity: Math.max(item.quantity - 1, 0) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const orderTotal = cart.reduce(
    (sum, item) => sum + item.quantity * item.dessert.price,
    0
  );

  // Get quantity for a dessert in cart
  const getQuantity = (dessertId: number) => {
    const item = cart.find((c) => c.dessert.id === dessertId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="w-full min-h-screen grid grid-cols-[2fr_1fr] gap-6 p-6">
      {/* Left side: Desserts */}
      <div className="flex flex-col gap-6">
        <h1 className="text-gray-600 font-bold text-2xl text-left">Desserts</h1>
        <div className="grid grid-cols-3 gap-4">
          {dessertsData.map((dessert) => (
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
                  onMouseEnter={() => setHoveredId(dessert.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {hoveredId === dessert.id ? (
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
                        src="/public/icon-add-to-cart.svg"
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

      {/* Right side: Cart */}
      <div className="flex items-start justify-center">
        <div className="rounded-lg shadow-lg bg-white overflow-hidden w-full max-w-sm h-fit flex flex-col">
          <h4 className="text-red-400 font-bold text-2xl text-left p-4">
            Your Cart ({totalItems})
          </h4>

          {cart.length === 0 ? (
            <>
              <img
                src="/public/image-meringue-desktop.jpg"
                alt="Meringue dessert"
                className="w-24 h-24 m-auto rounded-lg object-cover shadow-lg"
              />
              <p className="text-gray-400 font-md text-md text-center p-4">
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
                    <p className="font-semibold">{item.dessert.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantity}x @ ${item.dessert.price.toFixed(2)} = $
                      {(item.quantity * item.dessert.price).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.dessert.id)}
                    className=" font-bold text-xl"
                  >
                    <img
                      src="/public/icon-remove-item.svg"
                      alt="Remove from cart"
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
            <button className="bg-red-400 text-white font-bold py-3 m-4 rounded-xl">
              Confirm Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
