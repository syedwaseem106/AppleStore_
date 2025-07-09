import type { GetServerSideProps, NextPage } from "next";
import Stripe from "stripe";
import ProductCard from "../components/ProductCard";
import Header from "../components/Header";
import { useState, useEffect, useContext, useRef } from "react";
import Spinner from "../components/Spinner";
import Head from "next/head";
import CartContext from "../components/context/CartContext";
import { Slide } from "@mui/material";
import Select, { SingleValue } from "react-select";

interface Product extends Stripe.Product {}

interface Price extends Stripe.Price {
  product: string | Product | Stripe.DeletedProduct;
}

export const getServerSideProps: GetServerSideProps = async () => {
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

  const iphones = all.filter((item) => {
    const product = item.product as any;
    return product.metadata?.device === "iphone";
  });

  const macbooks = all.filter((item) => {
    const product = item.product as any;
    return product.metadata?.device === "macbook";
  });

  const watches = all.filter((item) => {
    const product = item.product as any;
    return product.metadata?.device === "watch";
  });

  return {
    props: {
      all,
      iphones,
      macbooks,
      watches,
    },
  };
};

type Props = {
  all: Stripe.Price[];
  iphones: Stripe.Price[];
  macbooks: Stripe.Price[];
  watches: Stripe.Price[];
};

interface CategorieState {
  all: boolean;
  iphone: boolean;
  macbook: boolean;
  watch: boolean;
}

interface Option {
  value: string;
  label: string;
}

const Home: NextPage<Props> = ({ all, iphones, macbooks, watches }) => {
  const [categorie, setCategorie] = useState<CategorieState>({
    all: true,
    iphone: false,
    macbook: false,
    watch: false,
  });

  const [selectedOption, setSelectedOption] = useState<Option | null>({
    value: "new",
    label: "Sort By Addition Date",
  });

  const options = [
    { value: "new", label: "Sort By Addition Date" },
    { value: "highToLow", label: "Price: High to Low" },
    { value: "lowToHigh", label: "Price: Low to High" },
  ];

  const handleSelectChange = (
    option: SingleValue<{ value: string; label: string }>
  ) => {
    setSelectedOption(option);
  };

  const [loading, setLoading] = useState(true);

  const { alert = null, isAlertVisible } = useContext(CartContext);
  const [hideAlert, setHideAlert] = useState(false);

  const categoryRefs = [useRef<HTMLButtonElement>(null), useRef<HTMLButtonElement>(null), useRef<HTMLButtonElement>(null), useRef<HTMLButtonElement>(null)];

  const [applePop, setApplePop] = useState(false);
  const [popTimeout, setPopTimeout] = useState<NodeJS.Timeout | null>(null);

  const [entered, setEntered] = useState(false);
  const [showBuffer, setShowBuffer] = useState(false);

  useEffect(() => {
    const buttons = document.querySelectorAll("button");
    buttons.forEach((btn) => {
      if (btn.value === "all") {
        btn.style.pointerEvents = "none";
      }
    });

    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;

    if (isAlertVisible) {
      timeout = setTimeout(() => {
        setHideAlert(true);
      }, 1770);
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

  const handleCategorieClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const button = e.target as HTMLButtonElement;
    const buttonValue = button.value as keyof CategorieState;

    // Apple pop animation
    setApplePop(true);
    if (popTimeout) clearTimeout(popTimeout);
    const timeout = setTimeout(() => {
      setApplePop(false);
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 500);
      setCategorie((prevCategorie) => {
        return {
          ...prevCategorie,
          all: false,
          iphone: false,
          macbook: false,
          watch: false,
          [buttonValue]: !prevCategorie[buttonValue],
        };
      });
    }, 500); // pop duration
    setPopTimeout(timeout);
  };

  const applySorting = (
    items: Stripe.Price[],
    option: Option | null
  ): Stripe.Price[] => {
    if (!option) return items;

    let selectedItems: Stripe.Price[] = [...items];

    switch (option.value) {
      case "highToLow": {
        selectedItems.sort(
          (a, b) => (b.unit_amount ?? 0) - (a.unit_amount ?? 0)
        );
        break;
      }
      case "lowToHigh": {
        selectedItems.sort(
          (a, b) => (a.unit_amount ?? 0) - (b.unit_amount ?? 0)
        );
        break;
      }
      case "new": {
        selectedItems.sort((a, b) => (b.created ?? 0) - (a.created ?? 0));
        break;
      }
      default: {
        break;
      }
    }

    return selectedItems;
  };

  const filteredItems = (): Stripe.Price[] => {
    switch (true) {
      case categorie.all:
        return applySorting(all, selectedOption);
      case categorie.iphone:
        return applySorting(iphones, selectedOption);
      case categorie.macbook:
        return applySorting(macbooks, selectedOption);
      case categorie.watch:
        return applySorting(watches, selectedOption);
      default:
        return [];
    }
  };

  // Move apple indicator on category change
  useEffect(() => {
    const bar = document.getElementById('category-bar');
    const apple = document.getElementById('apple-indicator');
    let activeIdx = 0;
    if (categorie.all) activeIdx = 0;
    else if (categorie.iphone) activeIdx = 1;
    else if (categorie.macbook) activeIdx = 2;
    else if (categorie.watch) activeIdx = 3;
    const btn = categoryRefs[activeIdx].current;
    const nextBtn = categoryRefs[activeIdx + 1]?.current;
    if (bar && apple && btn) {
      const barRect = bar.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      let x;
      if (nextBtn) {
        const nextRect = nextBtn.getBoundingClientRect();
        x = ((btnRect.right + nextRect.left) / 2) - barRect.left - 10;
      } else {
        x = btnRect.right - barRect.left + 8;
      }
      apple.style.setProperty('--apple-x', `${x}px`);
    }
  }, [categorie]);

  return (
    <>
      <Head>
        <title>Apple Store</title>
      </Head>
      <main className="bg-gray-100 min-h-screen">
        <Header />
        <div className="max-w-5xl mx-auto py-8 px-4">
          {!entered && !showBuffer && (
            <section className="w-full flex flex-col items-center justify-center py-16 mb-8 bg-gradient-to-b from-white via-gray-50 to-gray-100 rounded-3xl shadow-md">
              <div className="flex flex-col items-center">
                <img src="/apple-icon.svg" alt="Apple Logo" className="w-24 h-24 mb-4 drop-shadow-lg" />
                <h1 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight select-none" style={{letterSpacing: '0.04em'}}>Welcome to Apple Store</h1>
                <p className="text-lg text-gray-600 mb-8 text-center max-w-xl">Experience the elegance of Apple products. Shop the latest iPhones, MacBooks, Watches, and more—all in one place.</p>
                <button
                  className="text-lg font-semibold px-8 py-3 rounded-3xl bg-black text-white shadow-lg transition-all duration-300 ease-out"
                  style={{
                    boxShadow: '0 8px 24px 0 rgba(0,0,0,0.10), 0 1.5px 6px 0 rgba(0,0,0,0.08)',
                    perspective: '800px',
                    transformStyle: 'preserve-3d',
                  }}
                  onMouseMove={e => {
                    const btn = e.currentTarget;
                    const rect = btn.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    const rotateX = ((y - centerY) / centerY) * 8;
                    const rotateY = ((x - centerX) / centerX) * -8;
                    btn.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.07)`;
                    btn.style.boxShadow = '0 16px 40px 0 rgba(0,0,0,0.18), 0 2px 8px 0 rgba(0,0,0,0.10)';
                  }}
                  onMouseLeave={e => {
                    const btn = e.currentTarget;
                    btn.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
                    btn.style.boxShadow = '0 8px 24px 0 rgba(0,0,0,0.10), 0 1.5px 6px 0 rgba(0,0,0,0.08)';
                  }}
                  onClick={() => {
                    setShowBuffer(true);
                    setTimeout(() => {
                      setShowBuffer(false);
                      setEntered(true);
                    }, 1000);
                  }}
                >
                  Get Started
                </button>
              </div>
            </section>
          )}
          {showBuffer && (
            <div className="flex flex-col items-center justify-center w-full h-[60vh] min-h-[300px]">
              <img src="/apple-icon.svg" alt="Apple Logo" className="w-20 h-20 animate-pulse mb-4" />
              <span className="text-lg text-gray-500 font-medium tracking-wide">Loading...</span>
            </div>
          )}
          {entered && (
            <>
              <div className="relative flex items-center justify-center sm:justify-between flex-wrap gap-4 border-b pb-3 pl-5 lg:pl-0 px-6 sm:px-8 lg:px-1" id="category-bar">
                <button
                  value="all"
                  onClick={handleCategorieClick}
                  className={`font-normal tracking-wide leading-8 text-lg px-3 py-1.5 rounded-full bg-transparent transition-all duration-300
                    ${categorie.all ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"}
                  `}
                  style={{}}
                  ref={categoryRefs[0]}
                >
                  All
                </button>
                <button
                  value="iphone"
                  onClick={handleCategorieClick}
                  className={`font-normal tracking-wide leading-8 text-lg px-3 py-1.5 rounded-full bg-transparent transition-all duration-300
                    ${categorie.iphone ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"}
                  `}
                  style={{}}
                  ref={categoryRefs[1]}
                >
                  iPhone
                </button>
                <button
                  value="macbook"
                  onClick={handleCategorieClick}
                  className={`font-normal tracking-wide leading-8 text-lg px-3 py-1.5 rounded-full bg-transparent transition-all duration-300
                    ${categorie.macbook ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"}
                  `}
                  style={{}}
                  ref={categoryRefs[2]}
                >
                  MacBook
                </button>
                <button
                  value="watch"
                  onClick={handleCategorieClick}
                  className={`font-normal tracking-wide leading-8 text-lg px-3 py-1.5 rounded-full bg-transparent transition-all duration-300
                    ${categorie.watch ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"}
                  `}
                  style={{}}
                  ref={categoryRefs[3]}
                >
                  Watch
                </button>
              </div>
              <div className="px-6 sm:px-8 lg:px-0">
                <div className="w-full max-w-xs mx-auto">
                  <Select
                    value={selectedOption}
                    onChange={handleSelectChange}
                    options={options}
                    placeholder="Sort By Addition Date"
                    classNamePrefix="custom-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        backgroundColor: '#fff',
                        borderColor: '#e5e7eb',
                        borderRadius: '9999px',
                        minHeight: '2.5rem',
                        boxShadow: '0 1px 4px 0 rgba(0,0,0,0.03)',
                        paddingLeft: '0.5rem',
                        paddingRight: '0.5rem',
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: '#374151',
                        fontWeight: 500,
                      }),
                      menu: (base) => ({
                        ...base,
                        borderRadius: '1rem',
                        boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
                      }),
                      option: (base, state) => ({
                        ...base,
                        borderRadius: '0.75rem',
                        backgroundColor: state.isSelected ? '#f3f4f6' : state.isFocused ? '#f9fafb' : '#fff',
                        color: '#111827',
                      }),
                    }}
                  />
                </div>
              </div>
              <div className="mt-8 grid justify-items-center grid-cols-1 gap-y-20 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 xl:gap-x-8">
                {!loading && filteredItems().map((p) => (
                  <ProductCard cardId={p.id} key={p.id} price={p} />
                ))}
              </div>
            </>
          )}
          <div
            className={`fixed z-999 top-0 left-0 w-full h-full flex items-center justify-center ${
              loading ? "visible" : "invisible"
            }`}
          >
            {loading && <Spinner />}
          </div>
          {/* Apple Pop Fullscreen Animation */}
          {applePop && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 9999,
                background: 'rgba(255,255,255,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.3s',
              }}
            >
              <img
                src="/apple-icon.svg"
                alt="apple"
                style={{
                  width: '30vw',
                  height: '30vw',
                  minWidth: 180,
                  minHeight: 180,
                  maxWidth: 400,
                  maxHeight: 400,
                  filter: 'drop-shadow(0 0 40px #0002)',
                  animation: 'applePop 0.5s cubic-bezier(0.4,0,0.2,1) forwards',
                }}
              />
              <style>{`
                @keyframes applePop {
                  0% { transform: scale(0.1); opacity: 0; }
                  60% { transform: scale(1.1); opacity: 1; }
                  100% { transform: scale(1); opacity: 1; }
                }
              `}</style>
            </div>
          )}
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
      <footer className="w-full text-center py-4 bg-white bg-opacity-80 fixed bottom-0 left-0 z-50 shadow-inner">
        <span className="text-gray-500 text-sm select-none">Created by @syed </span>
      </footer>
    </>
  );
};

export default Home;
