import { createContext, ReactElement } from "react";
import Stripe from "stripe";

export type CartContextProps = {
  items?: Stripe.Price[];
  remove?: (productID: string) => void;
  removeAll?: () => void;
  total?: number,
  add?: (product: Stripe.Price) => void;
  alert?: ReactElement<any, any> | null;
  isAlertVisible?: boolean | undefined;
};

const cartContextProps: CartContextProps = {};

const CartContext = createContext(cartContextProps);

export default CartContext;
