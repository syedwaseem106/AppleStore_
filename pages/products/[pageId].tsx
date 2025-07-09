import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextPage,
} from "next";
import Head from "next/head";
import { CardProps } from "../../components/ProductCard";
import { LazyLoadImage } from "react-lazy-load-image-component";
import Stripe from "stripe";
import Header from "../../components/Header";
import {
  getProductPrice,
  getProductDescription,
  getProductImage,
  getProductName,
} from "../../utils/computed";
import { useContext, useState, useEffect } from "react";
import CartContext from "../../components/context/CartContext";
import { useRouter } from "next/router";
import { Slide } from "@mui/material";

interface Product extends Stripe.Product {}

interface Price extends Stripe.Price {
  product: string | Product | Stripe.DeletedProduct;
}

interface CustomContext extends GetServerSidePropsContext {
  query: {
    pageId?: string;
  };
}

export const getServerSideProps: GetServerSideProps = async (
  context: CustomContext
) => {
  const { pageId } = context.query;

  const stripe = new Stripe(process.env.STRIPE_SECRET ?? "", {
    apiVersion: "2023-08-16",
  });

  let all: Price[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const res = await stripe.prices.list({
      expand: ["data.product"],
      limit: 100,
      starting_after: startingAfter,
    });

    const prices = res.data.filter((price) => price.active);
    all = [...all, ...prices];

    hasMore = res.has_more;

    if (hasMore) {
      startingAfter = prices[prices.length - 1].id;
    }
  }

  const price = all.filter((stuff) => {
    return stuff.id === pageId;
  });

  return {
    props: {
      price,
    },
  };
};

const ProductPage: NextPage<CardProps & { price: Price[] }> = ({ price }) => {
  if (!price || price.length === 0) {
    return (
      <>
        <Head>
          <title>Apple Store</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <main>
          <Header />
          <p>Product not found</p>
        </main>
      </>
    );
  }

  const product = price[0].product;

  const { add, alert = null, isAlertVisible } = useContext(CartContext);
  const [hideAlert, setHideAlert] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;

    if (isAlertVisible) {
      timeout = setTimeout(() => {
        setHideAlert(true);
      }, 1760);
    }

    return () => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
    };
  }, [isAlertVisible]);

  const handleAlertExited = () => {
    setHideAlert(false);
  };

  const addToCart = (p: Stripe.Price) => {
    if (add) {
      add(p);
    }
  };

  const router = useRouter();

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    router.push("/");
  };

  return (
    <>
      <Head>
        <title>Apple Store</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main>
        <Header />
        <div className="bg-gray-100 min-h-screen relative w-full">
          <div className="w-full max-w-5xl px-8 mx-auto sm:px-8 lg:px-3">
            <button
              className="inline-block mt-6 w-max bg-slate-800 border border-transparent rounded-3xl py-2 px-6 items-center justify-center text-sm font-medium text-white hover:bg-slate-700"
              onClick={handleBack}
              title="Go back to store"
            >{`⇦ Back to store`}</button>
          </div>

          <LazyLoadImage
            src={getProductImage(product)}
            alt={getProductDescription(product)}
            className="max-w-sm mx-auto h-full object-center object-cover mt-5"
          />
          <h1 className=" text-3xl text-gray-900 text-center mt-8">
            {getProductName(product)}
          </h1>
          <p className=" text-xl text-center italic px-4 mt-6">
            {getProductDescription(product)}
          </p>
          <p className=" text-5xl text-center mt-8 tracking-wide text-gray-700">{`${getProductPrice(price[0])}$`}</p>

          <div className="mt-4">
            <button
              onClick={() => price.forEach((p) => addToCart(p))}
              className="relative mt-5 mb-5 w-[15rem] mx-auto flex bg-gray-300 border border-transparent rounded-md py-2 px-8 items-center justify-center text-sm font-medium text-gray-900 hover:bg-gray-400 hover:text-slate-100 lg:active:bg-gray-200 lg:active:text-gray-900 transition-all duration-200 ease-in-out"
            >
              Add to bag
            </button>
          </div>
        </div>
        <div className="fixed bottom-10 left-5" style={{ zIndex: 999 }}>
          {isAlertVisible && alert !== null && (
            <Slide
              direction="right"
              in={!hideAlert}
              onExited={handleAlertExited}
              unmountOnExit
            >
              {alert}
            </Slide>
          )}
        </div>
      </main>
    </>
  );
};

export default ProductPage;
