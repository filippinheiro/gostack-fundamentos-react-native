/* eslint-disable import/no-extraneous-dependencies */
import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import { idText } from 'typescript';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem(
        '@GoMarketPlace:products',
      );

      if (storagedProducts) {
        setProducts(JSON.parse(storagedProducts));
      }
    }

    loadProducts();
  }, []);

  const decrement = useCallback(
    async id => {
      const currentProduct = products.find(element => element.id === id);

      if (currentProduct) {
        const decrementedItemArray = products.map(
          ({ id: itemId, quantity, ...rest }) => {
            if (itemId === id && quantity > 0) {
              return {
                id: itemId,
                quantity: quantity - 1,
                ...rest,
              } as Product;
            }
            return {
              id: itemId,
              quantity,
              ...rest,
            } as Product;
          },
        );

        const noZeroQuantities = decrementedItemArray.filter(
          item => item.quantity > 0,
        );

        setProducts(noZeroQuantities);

        await AsyncStorage.setItem(
          '@GoMarketPlace:products',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const current = products.find(product => id === product.id);
      if (current) {
        const newProductState = products.map(
          ({ id: itemId, quantity, ...rest }) => {
            if (itemId === id) {
              return {
                id: itemId,
                quantity: quantity + 1,
                ...rest,
              } as Product;
            }
            return {
              id: itemId,
              quantity,
              ...rest,
            } as Product;
          },
        );
        setProducts(newProductState);
      }

      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const oldProduct = products.find(element => product.id === element.id);
      if (oldProduct) {
        increment(product.id);
        return;
      }
      setProducts([
        ...products,
        {
          ...product,
          quantity: 1,
        },
      ]);

      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(products),
      );
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
