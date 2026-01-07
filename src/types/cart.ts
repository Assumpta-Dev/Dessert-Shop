export interface Dessert {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  inStock: boolean;
}

export interface CartItem {
  dessert: Dessert;
  quantity: number;
  addedAt: Date;
}
